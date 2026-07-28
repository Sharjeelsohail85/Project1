<?php namespace App\Modules\Auth\Transformers;

use App\Modules\Managers\SessionToken\SessionTokenModel;
use League\Fractal\TransformerAbstract;
use Illuminate\Support\Facades\Auth;


class LoginTransformer extends TransformerAbstract
{

    protected array $availableIncludes = [];
    protected array $defaultIncludes = [];
    

    /**
     * Turn this item object into a generic array
     *
     * @return array
     */
    public function transform(SessionTokenModel $token)
    {
        return[
            'token' => $token->token,
            // Keep both keys for backward compatibility.
            // Frontend integration expects client_id.
            'client_id' => $token->client_id,
            'client' => $token->client_id,
            'device' => $token->device,
            'os' => $token->os
        ];
    }
    
}

