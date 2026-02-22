<?php namespace App\Modules\Auth\Controllers;

use App\Modules\ApiBaseController;
use App\Http\Controllers\Controller;

use League\Fractal\Manager;
use Illuminate\Support\Facades\Hash;

use App\Modules\Managers\User\UserRepositoryInterface;
use App\Modules\User\Validators\UserValidator;
use App\Modules\Helper\Helper;
use App\Modules\Auth\Transformers\LoginTransformer;
use App\Modules\User\Transformers\UserTransformer;

use App\Modules\Managers\SessionToken\SessionTokenRepositoryInterface;
use App\Modules\Auth\Validators\LoginValidator;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;

class AuthController extends ApiBaseController
{
    public function __construct(Manager $fractal, UserRepositoryInterface $userRepo, SessionTokenRepositoryInterface $tokenRepo)
    {
        $this->user = $userRepo;
        $this->token = $tokenRepo;
        $this->userValidator = new UserValidator();
        $this->helper = new Helper();
        $this->loginValidator = new LoginValidator();
        parent::__construct($fractal);
        
    }
    
    public function activateUser1($confirmationCode, $reconfirmCode, $UUID)
    {
        $res = $this->user->activateUser($confirmationCode, $reconfirmCode, $UUID);
        if($res)
        {
            die("Your Account is activated Successfully");
        }
         die("Something went wrong");
    }
    
    public function login(Request $request)
    {
        try
        {
            if(!$request->exists('data'))
            {
                return $this->errorWrongArgs(['No Input found']);
            }

            $data = $request->get('data');
            $validation = $this->loginValidator->login($data);
            if($validation)
            {
                return $this->errorWrongArgs($validation['errors']);
            }

            $data = $this->helper->clearEmptyValues($data);

            $user = $this->user->getCurrentUser($data['email']);
            if(!$user)
            {
                return $this->errorWrongArgs(['Username does not exist']);
            }

            if($user->registration_type !== 'general')
            {
                return $this->errorWrongArgs(['This account is linked to social login. Please use the same provider.']);
            }

            if((int)$user->active !== 1)
            {
                return $this->errorWrongArgs(['Your account is not active yet']);
            }

            if(!Hash::check($data['password'], $user->password))
            {
                return $this->errorWrongArgs(['Incorrect password']);
            }

            unset($data['email']);
            unset($data['password']);
            $sessionData = $data;
            $sessionData['uuid'] = $this->helper->addUuid();
            $sessionData['token'] = $this->helper->addUuid() . '-' . $this->helper->addUuid();
            $sessionData['expiry_date'] = null;
            $sessionData['user_id'] = $user->uuid;

            $token = $this->token->insertData($sessionData);
            return $this->respondWithItem($token, new LoginTransformer());
        }
        catch (\Throwable $e)
        {
            return $this->errorInternalError(['Unable to login']);
        }
    }
    
    public function register(Request $request)
    {
        try
        {
            if(!$request->exists('data'))
            {
                return $this->errorWrongArgs(['No Input found']);
            }

            $data = $request->get('data');
            $validation = $this->loginValidator->register($data);
            if($validation)
            {
                return $this->errorWrongArgs($validation['errors']);
            }

            $data = $this->helper->clearEmptyValues($data);

            $existingUser = $this->user->getCurrentUser($data['email']);
            if($existingUser)
            {
                return $this->errorWrongArgs(['Username already exists']);
            }

            $data['password'] = Hash::make($data['password']);
            $data['uuid'] = $this->helper->addUuid();
            $data['registration_type'] = 'general';
            $data['active'] = 1;

            if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'country_id') && empty($data['country_id']))
            {
                $countryId = null;

                if (\Illuminate\Support\Facades\Schema::hasTable('countries'))
                {
                    $country = \Illuminate\Support\Facades\DB::table('countries')->first();
                    if ($country && isset($country->uuid))
                    {
                        $countryId = $country->uuid;
                    }
                    else
                    {
                        $countryId = $this->helper->addUuid();
                        \Illuminate\Support\Facades\DB::table('countries')->insert([
                            'uuid' => $countryId,
                            'name' => 'default-country',
                        ]);
                    }
                }

                if (!$countryId)
                {
                    $countryId = $this->helper->addUuid();
                }

                $data['country_id'] = $countryId;
            }

            $user = $this->user->create($data);
            return $this->respondWithItem($user, new UserTransformer());
        }
        catch (\Throwable $e)
        {
            \Log::error('Auth register failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->get('data'),
            ]);
            return $this->errorInternalError(['Unable to register user']);
        }
    }

    public function oauthCallback(Request $request)
    {
        try
        {
            if(!$request->exists('data'))
            {
                return $this->errorWrongArgs(['No Input found']);
            }

            $data = (array)$request->get('data');
            $provider = strtolower(trim((string)($data['provider'] ?? '')));
            $code = trim((string)($data['code'] ?? ''));

            if($provider === '')
            {
                return $this->errorWrongArgs(['Provider is required']);
            }

            if($code === '')
            {
                return $this->errorWrongArgs(['Authorization code is required']);
            }

            if($provider !== 'google')
            {
                return $this->errorWrongArgs(['Unsupported oauth provider']);
            }

            $googleUser = $this->fetchGoogleUserFromCode($code);
            $email = strtolower(trim((string)($googleUser['email'] ?? '')));

            if($email === '')
            {
                return $this->errorWrongArgs(['Google account email is not available']);
            }

            $user = $this->user->getCurrentUser($email);

            if(!$user)
            {
                $userData = [
                    'uuid' => $this->helper->addUuid(),
                    'first_name' => trim((string)($googleUser['given_name'] ?? '')) ?: 'Google',
                    'last_name' => trim((string)($googleUser['family_name'] ?? '')) ?: 'User',
                    'email' => $email,
                    'password' => Hash::make($this->helper->addUuid()),
                    'registration_type' => $provider,
                    'registration_reference_id' => trim((string)($googleUser['sub'] ?? '')),
                    'active' => 1,
                    'address' => '',
                    'phone' => '',
                ];

                if(Schema::hasColumn('users', 'country_id'))
                {
                    $countryId = $this->resolveDefaultCountryId();
                    if($countryId)
                    {
                        $userData['country_id'] = $countryId;
                    }
                }

                $user = $this->user->create($userData);
            }
            else
            {
                if($user->registration_type !== 'general' && $user->registration_type !== $provider)
                {
                    return $this->errorWrongArgs(['This account is linked to social login. Please use the same provider.']);
                }

                $updateData = [];
                if((int)$user->active !== 1)
                {
                    $updateData['active'] = 1;
                }

                if(empty($user->registration_reference_id) && !empty($googleUser['sub']))
                {
                    $updateData['registration_reference_id'] = trim((string)$googleUser['sub']);
                }

                if(!empty($updateData))
                {
                    $this->user->update($updateData, $user->uuid);
                    $user = $this->user->find($user->uuid);
                }
            }

            $sessionData = [
                'uuid' => $this->helper->addUuid(),
                'token' => $this->helper->addUuid() . '-' . $this->helper->addUuid(),
                'client_id' => trim((string)($data['client_id'] ?? '')) ?: 'web_oauth_client',
                'device' => trim((string)($data['device'] ?? '')) ?: 'web-browser',
                'os' => trim((string)($data['os'] ?? '')) ?: 'web',
                'expiry_date' => null,
                'user_id' => $user->uuid,
            ];

            $token = $this->token->insertData($sessionData);

            return $this->respondWithData([
                'token' => $token->token,
                'client_id' => $token->client_id,
                'device' => $token->device,
                'os' => $token->os,
                'user' => [
                    'uuid' => $user->uuid,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'registration_type' => $user->registration_type,
                    'active' => $user->active,
                    'color' => $user->color,
                ],
            ]);
        }
        catch (\Throwable $e)
        {
            \Log::error('OAuth callback failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return $this->errorWrongArgs(['Unable to complete oauth authentication']);
        }
    }

    private function fetchGoogleUserFromCode($code)
    {
        $clientId = trim((string)(env('GOOGLE_CLIENT_ID') ?: env('VITE_GOOGLE_CLIENT_ID') ?: config('services.google.client_id')));
        $clientSecret = trim((string)(env('GOOGLE_CLIENT_SECRET') ?: env('VITE_GOOGLE_CLIENT_SECRET') ?: config('services.google.client_secret')));
        $redirectUri = trim((string)(env('GOOGLE_REDIRECT_URI') ?: env('VITE_GOOGLE_REDIRECT_URI') ?: 'http://localhost:3000/auth/google/callback'));

        if($clientId === '' || $clientSecret === '')
        {
            throw new \RuntimeException('Google OAuth is not configured on backend');
        }

        $tokenResponse = Http::asForm()
            ->timeout(20)
            ->post('https://oauth2.googleapis.com/token', [
                'code' => $code,
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'redirect_uri' => $redirectUri,
                'grant_type' => 'authorization_code',
            ]);

        if(!$tokenResponse->successful())
        {
            throw new \RuntimeException('Google token exchange failed');
        }

        $tokenPayload = (array)$tokenResponse->json();
        $accessToken = trim((string)($tokenPayload['access_token'] ?? ''));

        if($accessToken === '')
        {
            throw new \RuntimeException('Google did not return an access token');
        }

        $userResponse = Http::withToken($accessToken)
            ->acceptJson()
            ->timeout(20)
            ->get('https://www.googleapis.com/oauth2/v3/userinfo');

        if(!$userResponse->successful())
        {
            throw new \RuntimeException('Unable to fetch Google user profile');
        }

        return (array)$userResponse->json();
    }

    private function resolveDefaultCountryId()
    {
        if(!Schema::hasTable('countries'))
        {
            return null;
        }

        $country = DB::table('countries')->first();
        if($country && isset($country->uuid))
        {
            return $country->uuid;
        }

        $countryId = $this->helper->addUuid();
        DB::table('countries')->insert([
            'uuid' => $countryId,
            'name' => $this->helper->addUuid(),
        ]);

        return $countryId;
    }
}
