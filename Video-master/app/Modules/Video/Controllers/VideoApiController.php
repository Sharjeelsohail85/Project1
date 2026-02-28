<?php namespace App\Modules\Video\Controllers;

use App\Modules\ApiBaseController;
use App\Http\Controllers\Controller;

use League\Fractal\Manager;
use Illuminate\Http\Request;

use App\Modules\Managers\Video\VideoRepositoryInterface;
use App\Modules\Managers\PrivacyOption\PrivacyOptionRepositoryInterface;
use App\Modules\Managers\VideoLog\VideoLogRepositoryInterface;
use App\Modules\Managers\VideoHistory\VideoHistoryRepositoryInterface;
use App\Modules\Managers\Channel\ChannelRepositoryInterface;
use App\Modules\Video\Validators\VideoValidator;
use App\Modules\Helper\Helper;
use App\Modules\Video\Transformers\VideoTransformer;
use App\Modules\Video\Transformers\PrivacyOptionTransformer;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\URL;
use App\Modules\Video\Transformers\VideoHistoryTransformer;
use App\Modules\Managers\User\UserRepositoryInterface;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\File;
use Symfony\Component\Process\Process;
use App\Jobs\MigrateVideoJob;

use Google_Service_Drive_Permission;
use Kunnu\Dropbox\DropboxFile;
use Kunnu\Dropbox\DropboxApp;
use Kunnu\Dropbox\Dropbox;

use Google_Client;
use Google_Service_YouTube;
use Google_Service_YouTube_VideoStatus;
use Google_Service_YouTube_VideoSnippet;
use Google_Service_YouTube_Video;
use Google_Http_MediaFileUpload;

const MIGRATION_JOB_CACHE_TTL_SECONDS = 3600;
const OAUTH_PROVIDER_STATE_CACHE_TTL_SECONDS = 600;

//tyyJR1VDZKAAAAAAAAAE99P1cxgDW-uEBEJn3myW0mDCfXNEDhDsh55_uDBuIpTL

class VideoApiController extends ApiBaseController
{
    public function __construct(Request $request, Manager $fractal, VideoRepositoryInterface $videoRepo, 
            PrivacyOptionRepositoryInterface $privacyOptionsRepo, VideoLogRepositoryInterface $videoLogRepo, 
            VideoHistoryRepositoryInterface $videoHistoryRepo,
            ChannelRepositoryInterface $channelRepo,
            UserRepositoryInterface $userRepo)
    {
        $this->video = $videoRepo;
        $this->videoValidator = new VideoValidator();
        $this->privacyOptions = $privacyOptionsRepo;
        $this->videoLog = $videoLogRepo;
        $this->videoHistory = $videoHistoryRepo;
        $this->channel = $channelRepo;
        $this->user = $userRepo;
        
        $google_redirect_url = route('glogin');
        $this->gClient = new \Google_Client();
        
        $this->gClient->setRedirectUri($google_redirect_url);
        
        $this->gClient->addScope('https://www.googleapis.com/auth/drive');
        
        $this->helper = new Helper();
        parent::__construct($fractal);
    }
    
//    public function store(Request $request)
//    {
//        if(!$request->exists('data'))
//        {
//            return $this->errorWrongArgs(['No Input found']);
//        }
//        
//        if (!$request->hasFile('video')) {
//            return $this->errorWrongArgs(['No Video Updated']);
//        }
//        
//        $data = $request->get('data');
//        $video = $request->file('video');
//        
//       
//        $validation = $this->videoValidator->store($data, $video);
//        
//        if($validation)
//        {
//            return $this->errorWrongArgs($validation['errors']);
//        }
//        
//        $extension = $video->extension();
//        $imageName = date('dmyHis') . $this->helper->addUuid();
//        //$path = $video->storeAs('/uploads/video', $imageName . '.' . $extension);
//        $video->move('uploads/video' , $imageName . '.' . $extension);
//        $data = $this->helper->clearEmptyValues($data);
//        $data['uuid'] = $this->helper->addUuid();
//        $data['user_id'] = $request->get('id');
//        $data['url'] = $imageName;
////        if($request->exists('thumbnail'))
////        {
////            $data['thumbnail'] = 
////        }
//        
//        $uuid = $this->video->insertData($data);
//        $video = $this->video->findWhere(['uuid' => $uuid])->first();
//        return $this->respondWithItem($video, new VideoTransformer());
//    }
    
    public function index(Request $request)
    {
        $videos = $this->video->getAllPublicVideos();
        return $this->respondWithCollection($videos, new VideoTransformer());
    }
    
    public function my(Request $request)
    {
        $videos = $this->video->findWhere(['user_id'  => $request->get('id')]);
        return $this->respondWithCollection($videos, new VideoTransformer());
    }
    
    public function show(Request $request, $id)
    {
        if($request->exists('id'))
        {
            $video = $this->video->findWhere(['uuid' => $id])->first();
            if($video && ($video['user_id'] != $request->get('id')))
            {
                return $this->respondWithCollection([], new ChannelTransformer());
            }
        }
        else
        {
            $video = $this->video->findWhere(['uuid' => $id, 'active' => 1, 'admin_active' => 1])->first();
        }
        if(!$video)
        {
            return $this->errorWrongArgs(['Video not found']);
        }
        return $this->respondWithItem($video, new VideoTransformer());
//        $video = $this->video->findWhere(['uuid' => $id, 'active' => 1, 'admin_active' => 1])->first();
//        if(!$video)
//        {
//            return $this->errorWrongArgs(['Video not found']);
//        }
//        return $this->respondWithItem($video, new VideoTransformer());
    }
    
    public function showMe(Request $request, $id)
    {
        $videos = $this->video->findWhere(['user_id'  => $request->get('id'), 'uuid' => $id])->first();
        return $this->respondWithItem($videos, new VideoTransformer());
    }


    public function update(Request $request, $id)
    {
        if(!$request->exists('data'))
        {
            return $this->errorWrongArgs(['No Input found']);
        }
        
        
        $data = $request->get('data');
        $validation = $this->videoValidator->store($data);
        if($validation)
        {
            return $this->errorWrongArgs($validation['errors']);
        }
        
        $video = $this->video->findWhere(['user_id'  => $request->get('id'), 'uuid' => $id])->first();
        if(!$video)
        {
            return $this->respondWithError(['Video not found'], 201);
        }
        
        $data = $this->helper->clearEmptyValues($data);
        $video = $this->video->updateData($data, $id);
        
        return $this->respondWithBoolean($video, new VideoTransformer());
    }
    
    public function destroy(Request $request, $id)
    {
        $data = $request->get('data');
        $video = $this->video->findWhere(['user_id'  => $request->get('id'), 'uuid' => $id])->first();
        if(!$video)
        {
            return $this->errorWrongArgs(['Video not found']);
        }
        $video = $this->video->deleteData($id);
        
        return $this->respondWithBoolean($video, new VideoTransformer());
    }
    
    public function activate(Request $request, $id)
    {
        $data = $request->get('data');
        $video = $this->video->findWhere(['user_id'  => $request->get('id'), 'uuid' => $id])->first();
        if(!$video)
        {
            return $this->errorWrongArgs(['Video not found']);
        }
        $data['active'] = 1;
        $video = $this->video->updateData($data, $id);
        
        return $this->respondWithBoolean($video, new VideoTransformer());
    }
    
    public function deactivate(Request $request, $id)
    {
        $data = $request->get('data');
        $video = $this->video->findWhere(['user_id'  => $request->get('id'), 'uuid' => $id])->first();
        if(!$video)
        {
            return $this->errorWrongArgs(['Video not found']);
        }
        $data['active'] = 0;
        $video = $this->video->updateData($data, $id);
        
        return $this->respondWithBoolean($video, new VideoTransformer());
    }
    
    public function privacyOptions()
    {
        $privacyOptions = $this->privacyOptions->all();
        return $this->respondWithCollection($privacyOptions, new PrivacyOptionTransformer());
    }
    
    public function searchVideos($name, $noOfResults)
    {
        $videos = $this->video->searchVideos($name, $noOfResults);
        return $this->respondWithCollection($videos, new VideoTransformer());
    }
    
    
    public function currentVideoPosition(Request $request, $id)
    {
        if(!$request->exists('data'))
        {
            return $this->errorWrongArgs(['No Input found']);
        }
        $data = $request->get('data');
        
        $video = $this->video->findWhere(['uuid' => $id])->first();
        if(!$video)
        {
            return $this->errorWrongArgs(['Video not found']);
        }
        
        $validation = $this->videoValidator->videoLogInsert($data, $id);
        if($validation)
        {
            return $this->errorWrongArgs($validation['errors']);
        }
        
        $data = $this->helper->clearEmptyValues($data);
        $data['uuid'] = $this->helper->addUuid();
        $data['user_id'] = $request->get('id');
        $data['video_id'] = $id;
        
        $log = $this->videoLog->insertVideoDetails($data);
        return $this->respondWithBoolean($log, new VideoTransformer());
    }
    
    
    public function startVideo(Request $request, $videoID)
    {
        $video = $this->video->findWhere(['uuid' => $videoID])->first();
        if(!$video)
        {
            return $this->errorWrongArgs(['Video not found']);
        }
        
        $data['uuid'] = $this->helper->addUuid();
        $data['user_id'] = $request->get('id');
        $data['video_id'] = $videoID;
        
        $log = $this->videoHistory->insertData($data);
        return $this->respondWithBoolean($log, new VideoTransformer());
    }
    
    public function history(Request $request)
    {
        $history = $this->videoHistory->findWhere(['user_id' => $request->get('id')]);
        return $this->respondWithCollection($history, new VideoHistoryTransformer());
    }

    private function migrationStatusCacheKey($jobId)
    {
        return 'migration:job:' . trim((string)$jobId);
    }

    private function normalizeMigrationProvider($rawProvider)
    {
        $provider = strtolower(trim((string)$rawProvider));
        if($provider == 'google drive' || $provider == 'google_drive')
        {
            return 'gdrive';
        }
        if($provider == 'idrive e2')
        {
            return 'idrive';
        }
        if($provider == 'custom s3')
        {
            return 's3';
        }

        return $provider;
    }

    private function sanitizeMigrationMetadata($rawMetadata)
    {
        $metadata = is_array($rawMetadata) ? $rawMetadata : [];

        $title = trim((string)($metadata['title'] ?? ''));
        $description = trim((string)($metadata['description'] ?? ''));
        $thumbnail = trim((string)($metadata['thumbnail'] ?? ''));
        $visibility = strtolower(trim((string)($metadata['visibility'] ?? 'public')));
        if(!in_array($visibility, ['public', 'private', 'unlisted'], true))
        {
            $visibility = 'public';
        }

        $tags = $metadata['tags'] ?? [];
        if(!is_array($tags))
        {
            $tags = [];
        }

        $normalizedTags = [];
        $seen = [];
        foreach($tags as $tag)
        {
            $value = trim((string)$tag);
            if($value == '')
            {
                continue;
            }

            $key = strtolower($value);
            if(isset($seen[$key]))
            {
                continue;
            }
            $seen[$key] = true;
            $normalizedTags[] = $value;
        }

        return [
            'title' => $title,
            'description' => $description,
            'thumbnail' => $thumbnail,
            'visibility' => $visibility,
            'tags' => $normalizedTags,
        ];
    }

    private function rejectIfStreamingPlaylistUrl($sourceUrl)
    {
        $normalized = strtolower(trim((string)$sourceUrl));
        if($normalized == '')
        {
            return 'Video URL is required.';
        }

        if(preg_match('/\.(m3u8|mpd)(\?|$)/i', $normalized)
            || strpos($normalized, 'manifest') !== false
            || strpos($normalized, 'playlist') !== false)
        {
            return 'Streaming playlist URLs are not allowed. Use a direct file URL.';
        }

        return '';
    }

    private function resolveVisibilityToPrivacyUuid($visibility, $defaultPrivacyOption = null)
    {
        $normalized = strtolower(trim((string)$visibility));
        if($normalized == '')
        {
            $normalized = 'public';
        }

        $nameMap = [
            'public' => 'Public',
            'private' => 'Private',
            'unlisted' => 'Unlisted',
        ];

        $target = isset($nameMap[$normalized]) ? $nameMap[$normalized] : 'Public';
        $option = $this->privacyOptions->findWhere(['name' => $target])->first();
        if($option)
        {
            return (string)$option->uuid;
        }

        return $defaultPrivacyOption ? (string)$defaultPrivacyOption->uuid : '';
    }

    private function migrationPreviewHead($sourceUrl)
    {
        $url = trim((string)$sourceUrl);
        if($url == '')
        {
            return [
                'ok' => false,
                'status' => 0,
                'size' => 0,
                'mime' => '',
                'filename' => '',
                'message' => 'Video URL is required.',
            ];
        }

        try {
            $response = Http::timeout(20)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (compatible; MigrationValidator/1.0)',
                    'Accept' => '*/*',
                ])
                ->withOptions([
                    'allow_redirects' => true,
                    'verify' => false,
                ])
                ->head($url);

            if((int)$response->status() >= 400 || (int)$response->status() < 200)
            {
                $response = Http::timeout(30)
                    ->withHeaders([
                        'User-Agent' => 'Mozilla/5.0 (compatible; MigrationValidator/1.0)',
                        'Accept' => '*/*',
                        'Range' => 'bytes=0-0',
                    ])
                    ->withOptions([
                        'allow_redirects' => true,
                        'verify' => false,
                    ])
                    ->get($url);
            }

            $status = (int)$response->status();
            $headers = $response->headers();
            $mime = trim((string)($headers['Content-Type'][0] ?? ''));
            if($mime != '' && strpos($mime, ';') !== false)
            {
                $mime = trim((string)explode(';', $mime, 2)[0]);
            }

            $size = 0;
            $contentLength = trim((string)($headers['Content-Length'][0] ?? ''));
            if($contentLength !== '' && is_numeric($contentLength))
            {
                $size = (int)$contentLength;
            }
            else
            {
                $contentRange = trim((string)($headers['Content-Range'][0] ?? ''));
                if($contentRange != '' && preg_match('/\/(\d+)$/', $contentRange, $matches))
                {
                    $size = (int)$matches[1];
                }
            }

            $filename = basename((string)parse_url($url, PHP_URL_PATH));

            if($status < 200 || $status >= 400)
            {
                return [
                    'ok' => false,
                    'status' => $status,
                    'size' => $size,
                    'mime' => $mime,
                    'filename' => $filename,
                    'message' => 'Source returned HTTP status ' . $status,
                ];
            }

            return [
                'ok' => true,
                'status' => $status,
                'size' => $size,
                'mime' => $mime,
                'filename' => $filename,
                'message' => '',
            ];
        }
        catch (\Throwable $e)
        {
            return [
                'ok' => false,
                'status' => 0,
                'size' => 0,
                'mime' => '',
                'filename' => basename((string)parse_url($url, PHP_URL_PATH)),
                'message' => $e->getMessage(),
            ];
        }
    }

    private function cacheMigrationJobState($jobId, array $payload)
    {
        $key = $this->migrationStatusCacheKey($jobId);
        Cache::put($key, $payload, now()->addSeconds(MIGRATION_JOB_CACHE_TTL_SECONDS));
    }

    private function getCachedMigrationJobState($jobId)
    {
        $key = $this->migrationStatusCacheKey($jobId);
        return Cache::get($key);
    }

    private function updateCachedMigrationJobState($jobId, array $updates)
    {
        $existing = $this->getCachedMigrationJobState($jobId);
        if(!is_array($existing))
        {
            $existing = [];
        }

        $next = array_merge($existing, $updates);
        $this->cacheMigrationJobState($jobId, $next);

        return $next;
    }

    private function finalizeMigrationNow(array $job)
    {
        $jobId = trim((string)($job['jobId'] ?? ''));
        if($jobId == '')
        {
            throw new \RuntimeException('Invalid migration job id.');
        }

        $sourceUrl = trim((string)($job['sourceUrl'] ?? ''));
        if($sourceUrl == '')
        {
            throw new \RuntimeException('Source URL missing for migration job.');
        }

        $metadata = $this->sanitizeMigrationMetadata($job['metadata'] ?? []);
        if($metadata['title'] == '')
        {
            throw new \RuntimeException('Video title is required.');
        }

        $ownerUserId = trim((string)($job['userId'] ?? ''));
        $resolvedDefaults = $this->resolveDefaultPrivacyAndChannel($ownerUserId);
        $privacyOption = $resolvedDefaults['privacyOption'];
        $channel = $resolvedDefaults['channel'];

        if($ownerUserId == '' && $channel)
        {
            $ownerUserId = trim((string)$channel->user_id);
        }

        if(!$privacyOption || !$channel || $ownerUserId == '')
        {
            throw new \RuntimeException('Required privacy/channel configuration is missing.');
        }

        $this->updateCachedMigrationJobState($jobId, [
            'progress' => 10,
            'stage' => 'downloading',
            'completed' => false,
            'error' => '',
        ]);

        $downloadResult = $this->downloadSourceVideoToLocalPath($sourceUrl);
        if(!$downloadResult['success'])
        {
            throw new \RuntimeException(trim((string)$downloadResult['message']) ?: 'Unable to download source video.');
        }

        $downloadedPath = trim((string)($downloadResult['path'] ?? ''));
        if($downloadedPath == '' || !File::exists($downloadedPath))
        {
            throw new \RuntimeException('Downloaded source file is missing.');
        }

        $this->updateCachedMigrationJobState($jobId, [
            'progress' => 45,
            'stage' => 'uploading',
        ]);

        $provider = $this->normalizeMigrationProvider($job['provider'] ?? '');
        $ownerUser = null;
        if($ownerUserId != '')
        {
            $ownerUser = $this->user->find($ownerUserId);
        }

        $storageProvider = $this->resolvePreferredMigrationStorageProvider($provider, $ownerUser);
        $extension = strtolower((string)pathinfo($downloadedPath, PATHINFO_EXTENSION));
        if($extension == '')
        {
            $extension = 'mp4';
        }

        $storedFilename = date('YmdHis') . $this->helper->addUuid() . '.' . $extension;
        $videoUrl = $storedFilename;
        $playbackUrl = '';
        $tempPublicPath = '';

        try {
            if($storageProvider == 'terabox')
            {
                $providerUpload = $this->uploadFileToTeraboxViaNodeBridge($downloadedPath);
                if(!$providerUpload['success'])
                {
                    throw new \RuntimeException(trim((string)($providerUpload['error'] ?? 'Terabox upload failed.')));
                }

                $videoUrl = trim((string)($providerUpload['storageUrl'] ?? ''));
                if($videoUrl == '')
                {
                    throw new \RuntimeException('Terabox upload did not return storage URL.');
                }
                $playbackUrl = trim((string)($providerUpload['playbackUrl'] ?? ''));
            }
            elseif($storageProvider == 'hetzner')
            {
                $providerUpload = $this->uploadFileToHetznerStorage($downloadedPath, $storedFilename);
                if(!$providerUpload['success'])
                {
                    throw new \RuntimeException(trim((string)($providerUpload['error'] ?? 'Hetzner upload failed.')));
                }

                $videoUrl = trim((string)($providerUpload['storageUrl'] ?? ''));
                if($videoUrl == '')
                {
                    throw new \RuntimeException('Hetzner upload did not return storage URL.');
                }
                $playbackUrl = trim((string)($providerUpload['playbackUrl'] ?? ''));
            }
            elseif($storageProvider == 'dropbox')
            {
                $providerUpload = $this->uploadFileToDropboxStorage($downloadedPath, $ownerUser);
                if(!$providerUpload['success'])
                {
                    throw new \RuntimeException(trim((string)($providerUpload['error'] ?? 'Dropbox upload failed.')));
                }

                $videoUrl = trim((string)($providerUpload['storageUrl'] ?? ''));
                if($videoUrl == '')
                {
                    throw new \RuntimeException('Dropbox upload did not return storage URL.');
                }
                $playbackUrl = trim((string)($providerUpload['playbackUrl'] ?? ''));
            }
            else
            {
                $uploadDirectory = public_path('video');
                if(!File::exists($uploadDirectory))
                {
                    File::makeDirectory($uploadDirectory, 0755, true);
                }

                $tempPublicPath = $uploadDirectory . DIRECTORY_SEPARATOR . $storedFilename;
                File::copy($downloadedPath, $tempPublicPath);
                if(!File::exists($tempPublicPath))
                {
                    throw new \RuntimeException('Unable to persist downloaded video to local storage.');
                }

                $videoUrl = $storedFilename;
                $playbackUrl = url('/video/' . $storedFilename);
            }

            $this->updateCachedMigrationJobState($jobId, [
                'progress' => 80,
                'stage' => 'finalizing',
            ]);

            $resolvedPrivacyUuid = $this->resolveVisibilityToPrivacyUuid($metadata['visibility'], $privacyOption);
            if($resolvedPrivacyUuid == '')
            {
                $resolvedPrivacyUuid = (string)$privacyOption->uuid;
            }

            $videoUuid = $this->helper->addUuid();
            $videoData = [
                'uuid' => $videoUuid,
                'name' => $metadata['title'],
                'description' => $metadata['description'],
                'type' => 'Migration Upload',
                'url' => $videoUrl,
                'active' => 1,
                'admin_active' => 1,
                'user_id' => $ownerUserId,
                'privacy_option_id' => $resolvedPrivacyUuid,
                'channel_id' => (string)$channel->uuid,
                'thumbnail' => $metadata['thumbnail'],
            ];

            $videoRecord = $this->video->create($videoData);
            if(!$videoRecord)
            {
                throw new \RuntimeException('Unable to persist migrated video metadata.');
            }

            $finalStreamUrl = $this->buildMigrationStreamUrl(
                $videoUuid,
                (string)($job['token'] ?? ''),
                (string)($job['client_id'] ?? '')
            );
            if($finalStreamUrl == '')
            {
                $finalStreamUrl = $this->resolveStoredVideoPlaybackUrl($videoUrl, $videoUuid);
            }
            if($finalStreamUrl == '')
            {
                $finalStreamUrl = $playbackUrl;
            }

            $state = $this->updateCachedMigrationJobState($jobId, [
                'progress' => 100,
                'stage' => 'finalizing',
                'completed' => true,
                'videoId' => $videoUuid,
                'video_id' => $videoUuid,
                'playbackUrl' => $finalStreamUrl,
                'error' => '',
            ]);

            return $state;
        }
        finally
        {
            if($downloadedPath != '' && File::exists($downloadedPath))
            {
                File::delete($downloadedPath);
            }
        }
    }

    public function processMigrationJobFromQueue($jobId)
    {
        $resolvedJobId = trim((string)$jobId);
        if($resolvedJobId == '')
        {
            return false;
        }

        $state = $this->getCachedMigrationJobState($resolvedJobId);
        if(!is_array($state))
        {
            return false;
        }

        if(!empty($state['completed']) || !empty($state['error']))
        {
            return true;
        }

        $this->updateCachedMigrationJobState($resolvedJobId, [
            'progress' => max(5, (int)($state['progress'] ?? 0)),
            'stage' => 'downloading',
            'startedAt' => date('c'),
        ]);

        try {
            $this->finalizeMigrationNow($state);
        }
        catch (\Throwable $e)
        {
            $this->updateCachedMigrationJobState($resolvedJobId, [
                'completed' => false,
                'stage' => 'failed',
                'error' => trim((string)$e->getMessage()) != '' ? trim((string)$e->getMessage()) : 'Migration failed.',
            ]);
        }

        return true;
    }

    public function migrationValidate(Request $request)
    {
        $sourceUrl = trim((string)$request->get('sourceUrl', ''));
        $provider = $this->normalizeMigrationProvider($request->get('provider', ''));

        $playlistError = $this->rejectIfStreamingPlaylistUrl($sourceUrl);
        if($playlistError != '')
        {
            return $this->errorWrongArgs([$playlistError]);
        }

        if($provider == '')
        {
            return $this->errorWrongArgs(['Select a storage provider before validating.']);
        }

        $preview = $this->migrationPreviewHead($sourceUrl);
        if(!$preview['ok'])
        {
            return $this->errorWrongArgs([
                trim((string)$preview['message']) != ''
                    ? trim((string)$preview['message'])
                    : 'Unable to validate source URL',
            ]);
        }

        $mime = strtolower(trim((string)$preview['mime']));
        if($mime != '' && strpos($mime, 'video/') !== 0 && strpos($mime, 'application/octet-stream') !== 0)
        {
            return $this->errorWrongArgs(['URL did not resolve to a video mime type.']);
        }

        if($mime != '' && (strpos($mime, 'mpegurl') !== false || strpos($mime, 'dash') !== false))
        {
            return $this->errorWrongArgs(['Streaming playlist URLs are not supported.']);
        }

        return $this->respondWithData([
            'valid' => true,
            'size' => max(0, (int)$preview['size']),
            'mime' => $preview['mime'] != '' ? $preview['mime'] : 'video/mp4',
            'filename' => $preview['filename'] != '' ? $preview['filename'] : ('migration_' . date('YmdHis') . '.mp4'),
        ]);
    }

    public function migrationStart(Request $request)
    {
        $sourceUrl = trim((string)$request->get('sourceUrl', ''));
        $provider = $this->normalizeMigrationProvider($request->get('provider', ''));
        $metadata = $this->sanitizeMigrationMetadata($request->get('metadata', []));

        $playlistError = $this->rejectIfStreamingPlaylistUrl($sourceUrl);
        if($playlistError != '')
        {
            return $this->errorWrongArgs([$playlistError]);
        }

        if($provider == '')
        {
            return $this->errorWrongArgs(['Provider is required.']);
        }

        if($metadata['title'] == '')
        {
            return $this->errorWrongArgs(['Video title is required.']);
        }

        $validation = $this->migrationPreviewHead($sourceUrl);
        if(!$validation['ok'])
        {
            return $this->errorWrongArgs([
                trim((string)$validation['message']) != ''
                    ? trim((string)$validation['message'])
                    : 'Unable to validate source URL before migration start.',
            ]);
        }

        $jobId = $this->helper->addUuid();
        $jobState = [
            'jobId' => $jobId,
            'progress' => 0,
            'stage' => 'queued',
            'completed' => false,
            'videoId' => null,
            'video_id' => null,
            'playbackUrl' => '',
            'error' => '',
            'providerUploadWarning' => ((int)$validation['size'] > (2 * 1024 * 1024 * 1024))
                ? 'Large file detected (>2GB). Migration may take longer, but you can continue.'
                : '',
            'sourceUrl' => $sourceUrl,
            'provider' => $provider,
            'userId' => (string)$request->get('id', ''),
            'token' => (string)$request->get('token', ''),
            'client_id' => (string)$request->get('client_id', ''),
            'metadata' => $metadata,
            'createdAt' => date('c'),
        ];

        $this->cacheMigrationJobState($jobId, $jobState);

        try {
            MigrateVideoJob::dispatch($jobId);
            $this->updateCachedMigrationJobState($jobId, [
                'progress' => 1,
                'stage' => 'queued',
                'queuedAt' => date('c'),
            ]);
        }
        catch (\Throwable $e)
        {
            $this->updateCachedMigrationJobState($jobId, [
                'completed' => false,
                'stage' => 'failed',
                'error' => trim((string)$e->getMessage()) != '' ? trim((string)$e->getMessage()) : 'Unable to queue migration job.',
            ]);

            return $this->errorInternalError('Unable to queue migration job.');
        }

        return $this->respondWithData([
            'jobId' => $jobId,
        ]);
    }

    public function migrationStatus(Request $request, $jobId)
    {
        $resolvedJobId = trim((string)$jobId);
        if($resolvedJobId == '')
        {
            return $this->errorWrongArgs(['jobId is required']);
        }

        $state = $this->getCachedMigrationJobState($resolvedJobId);
        if(!is_array($state))
        {
            return $this->errorNotFound('Migration job not found or expired.');
        }

        if(!isset($state['userId']) || trim((string)$state['userId']) !== trim((string)$request->get('id', '')))
        {
            return $this->errorUnauthorized('Unauthorized migration job access.');
        }

        return $this->respondWithData([
            'jobId' => $resolvedJobId,
            'progress' => (int)($state['progress'] ?? 0),
            'stage' => (string)($state['stage'] ?? 'queued'),
            'completed' => (bool)($state['completed'] ?? false),
            'videoId' => $state['videoId'] ?? null,
            'video_id' => $state['video_id'] ?? null,
            'error' => (string)($state['error'] ?? ''),
            'providerUploadWarning' => (string)($state['providerUploadWarning'] ?? ''),
            'playbackUrl' => (string)($state['playbackUrl'] ?? ''),
        ]);
    }

    public function videoStreamUrl(Request $request, $id)
    {
        $videoUuid = trim((string)$id);
        if($videoUuid == '')
        {
            return $this->errorWrongArgs(['Video id is required']);
        }

        $video = $this->video->findWhere(['uuid' => $videoUuid])->first();
        if(!$video)
        {
            return $this->errorNotFound('Video not found');
        }

        $streamUrl = $this->buildMigrationStreamUrl(
            $videoUuid,
            (string)$request->get('token', ''),
            (string)$request->get('client_id', '')
        );

        if($streamUrl == '')
        {
            $streamUrl = $this->resolveStoredVideoPlaybackUrl((string)$video->url, $videoUuid);
        }

        if($streamUrl == '')
        {
            return $this->errorUnknown('Unable to resolve stream URL');
        }

        return $this->respondWithData([
            'id' => $videoUuid,
            'videoId' => $videoUuid,
            'streamUrl' => $streamUrl,
            'playbackUrl' => $streamUrl,
        ]);
    }
    
    public function pasteLink(Request $request)
    {
        if(!$request->exists('data'))
        {
            return $this->errorWrongArgs(['No Input found']);
        }
        
        $data = $request->get('data');
        $validation = $this->videoValidator->pasteLink($data);
        if($validation)
        {
            return $this->errorWrongArgs($validation['errors']);
        }
        
        $data = $this->helper->clearEmptyValues($data);
        
        $privacyOption = $this->privacyOptions->findWhere(['name' => 'Public'])->first();
        $channel = $this->channel->findWhere(['name' => 'General'])->first();
        
        $data['name'] = 'Plain URL - ' . $data['url'];
        $data['uuid'] = $this->helper->addUuid();
        $data['user_id'] = $request->get('id');
        
        $data['channel_id'] = $channel->uuid;
        $data['privacy_option_id'] = $privacyOption->uuid;
        $data['active'] = 1;
        
        $video = $this->video->create($data);
        return $this->respondWithItem($video, new VideoTransformer());
    }
    
    public function googleLogin(Request $request)  {
            if($request->exists('id'))
            {
                $id = $request->get('id');
                $request->session()->put('idValue', $id);
            }
            
            $id = $request->session()->get('idValue');
            
          //  $this->gClient->setAccessType("offline");
          //  $this->gClient->setApprovalPrompt("force");
            $user = $this->user->find($id);
            if(!$request->session()->has('videoUUID'))
            {
                if (!$request->hasFile('file'))
                {
                    return redirect()->back()->withErrors(['Video Not Found']);
                }

                $data = $request->get('data');
                $video = $request->file('file');

                $validation = $this->videoValidator->storeGoogle($data, $video);
                if($validation)
                {
                    return $this->errorWrongArgs($validation['errors']);
                }
                

                
                $errors = array();
                if($user->google_app_name == '')
                {
                    $errors[] = 'Google App Name Not Found for this user';
                }
                if($user->google_client_id == '')
                {
                    $errors[] = 'Google Client ID Not Found  for this user';
                }
                if($user->google_client_secret == '')
                {
                    $errors[] = 'Google Client Secret Not Found  for this user';
                }
                if($user->google_api_key == '')
                {
                    $errors[] = 'Google API Key Not Found  for this user';
                }
           
                if(!empty($errors))
                {
                    return redirect()->back()->withErrors($errors);
                }
                
                $privacyOption = $this->privacyOptions->findWhere(['name' => 'Public'])->first();
                $channel = $this->channel->findWhere(['name' => 'General'])->first();
                
                $extension = $video->extension();
                $imageName = date('dmyHis') . $this->helper->addUuid();
                //$request->session()->put('imageName', $imageName . '.' . $extension);
               // $path = $video->storeAs('/video/', $imageName . '.' . $extension);
                
                $video->move('video' , $imageName . '.' . $extension);
                $data = $this->helper->clearEmptyValues($data);
                $data['uuid'] = $this->helper->addUuid();
                $data['user_id'] = $request->get('id');
                $data['url'] = $imageName . '.' . $extension;
               //$data['channel_id'] = $channel->uuid;
               // $data['privacy_option_id'] = $privacyOption->uuid;
                $data['active'] = 1;
                $data['type'] = 'Google Drive';
                
                $request->session()->put('videoUUID', $data['uuid']);
                $request->session()->put('clientToken', $request->get('token'));
                $request->session()->put('clientID', $request->get('client_id'));

                $videoResult = $this->video->create($data);
                if(!$videoResult)
                {
                    return redirect()->back()->withErrors(['Something Went Wrong']);
                }
            }
            
            
            
            $this->gClient->setApplicationName($user->google_app_name);
            //$this->gClient->setScopes(SCOPES);
            $this->gClient->setClientId($user->google_client_id);
            $this->gClient->setClientSecret($user->google_client_secret);
            $this->gClient->setDeveloperKey($user->google_api_key);
            
            
            
            $google_oauthV2 = new \Google_Service_Oauth2($this->gClient);
            if ($request->get('code')){
                $this->gClient->authenticate($request->get('code'));
                $request->session()->put('token', $this->gClient->getAccessToken());
            }
            if ($request->session()->get('token'))
            {
                $this->gClient->setAccessToken($request->session()->get('token'));
            }
            if ($this->gClient->getAccessToken())
            {
                //For logged in user, get details from google using acces
               // $user=$this->user->find(1);
                //$user->access_token=json_encode($request->session()->get('token'));
               // $user->save();    
                $upload = $this->uploadFileUsingAccessToken($id);  
                if($upload)
                {
                    return redirect('/api/v1/video/google/drive/upload/get?token=' . Session::get('clientToken') . '&client_id=' . Session::get('clientID'))->withErrors(['Video Uploaded Successfully']);
                }
                else
                {
                    return redirect('/api/v1/video/google/drive/upload/get?token=' . Session::get('clientToken') . '&client_id=' . Session::get('clientID'))->withErrors(['Somethiong Went Wrong']);
                }
                //dd("Successfully authenticated");
            } else
            {
                //For Guest user, get google login url
                $authUrl = $this->gClient->createAuthUrl();
                return redirect()->to($authUrl);
            }
        }
        
        public function listGoogleUser(Request $request){
          //$users = $this->user->orderBy('uuid','DESC')->paginate(5);
         return view('users.list')->with('i', ($request->input('page', 1) - 1) * 5);;
        }
        
        public function uploadFileUsingAccessToken($id){
            $user = $this->user->find($id);
            $videoUpload= $this->video->find(Session::get('videoUUID'));
            $this->gClient->setApplicationName($user->google_app_name);
            //$this->gClient->setScopes(SCOPES);
            $this->gClient->setClientId($user->google_client_id);
            $this->gClient->setClientSecret($user->google_client_secret);
            $this->gClient->setDeveloperKey($user->google_api_key);
            
            $service = new \Google_Service_Drive($this->gClient);
           // $user=$this->user->find(1);
            $this->gClient->setAccessToken(Session::get('token'),true);
            
            if ($this->gClient->isAccessTokenExpired()) {
               
                // save refresh token to some variable
                $refreshTokenSaved = $this->gClient->getRefreshToken();
               
                $this->gClient->setAccessType('offline');
                $this->gClient->setApprovalPrompt('force');
                // update access token
                $this->gClient->fetchAccessTokenWithRefreshToken($refreshTokenSaved);    
                 
                // // pass access token to some variable
                $updatedAccessToken = $this->gClient->getAccessToken();
                
                // // append refresh token
                $updatedAccessToken['refresh_token'] = $refreshTokenSaved;
                
            
                //Set the new acces token
                $this->gClient->setAccessToken($updatedAccessToken);
                
               // $user->access_token=$updatedAccessToken;
              //  $user->save();                
            }
            
            Session::forget('videoUUID');
            $folderID = $user->google_folder_id;
            if($user->google_folder_id == '')
            {
            
                $fileMetadata = new \Google_Service_Drive_DriveFile(array(
                     'name' => 'Application Storage - Video',
                     'mimeType' => 'application/vnd.google-apps.folder'));


                 $folder = $service->files->create($fileMetadata, array(
                     'fields' => 'id'));
                 $folderID = $folder->id;
                 $userData['google_folder_id'] = $folderID;
                 
                 $userUpdate = $this->user->updateData($userData, $user->uuid);
                 if(!$userUpdate)
                 {
                     return 0;
                     exit;
                 }
            }
            
            //printf("Folder ID: %s\n", $folder->id);
               
            
            $file = new \Google_Service_Drive_DriveFile(array(
                            'name' => $videoUpload->name,
                            'parents' => array($folderID)
                        ));
            
            //Give everyone permission to read and write the file
//                $permission = new Google_Service_Drive_Permission();
//                $permission->setRole( 'writer' );
//                $permission->setType( 'anyone' );
//                $permission->setValue( 'me' );
//                $service->permissions->insert( $file->getId(), $permission );
            
            $result = $service->files->create($file, array(
              'data' => file_get_contents(public_path('video/' . $videoUpload->url)),
              'mimeType' => 'application/octet-stream',
              'uploadType' => 'media'
            ));
            
            File::delete(public_path('video/' . $videoUpload->url));
            // get url of uploaded file
            $url='https://drive.google.com/open?id='.$result->id;
            $data['url'] = 'https://docs.google.com/file/d/' . $result->id . '/view';
            
            $fileId = $result->id;
            $service->getClient()->setUseBatch(true);
            try {
                $batch = $service->createBatch();

                $userPermission = new Google_Service_Drive_Permission(array(
                    'type' => 'anyone',
                    'role' => 'reader'
                ));
                $request = $service->permissions->create(
                    $fileId, $userPermission, array('fields' => 'id'));
                $batch->add($request, 'user');
                $domainPermission = new Google_Service_Drive_Permission(array(
                    'type' => 'domain',
                    'role' => 'reader',
                    'domain' => url('/')
                ));
                $request = $service->permissions->create(
                    $fileId, $domainPermission, array('fields' => 'id'));
                $batch->add($request, 'domain');
                $results = $batch->execute();

                
            } finally {
                $service->getClient()->setUseBatch(false);
            }
            
            $update = $this->video->updateData($data, $videoUpload->uuid);
            if(!$update)
            {
                return 0;
                exit;
            }
            return 1;
            exit;
            
            // https://docs.google.com/file/d/1aaofFq1VLLtwAKaMOdfGTQMCThSrrSiw/edit
            
        }
        
        
        public function googleLoginGet()
        {
            return view('users.googleLogin');
        }
        
        public function dropboxFileUpload(Request $request)
        {
            $user = $this->user->find($request->get('id'));
            if(!$user)
            {
                return $this->errorWrongArgs(['User not found']);
            }

            $dropboxCredentials = $this->resolveDropboxCredentials($user);
            
            $errors = array();
            if($dropboxCredentials['client_id'] == '')
            {
                $errors[] = 'DropBox Key Not Found for this user';
            }
            if($dropboxCredentials['client_secret'] == '')
            {
                $errors[] = 'DropBox Secret Not Found  for this user';
            }
            if($dropboxCredentials['access_token'] == '')
            {
                $errors[] = 'DropBox Access Token Not Found for this user';
            }
            
            if(!empty($errors))
            {
                return redirect()->back()->withErrors($errors);
                exit;
            }
            
            if (!$request->hasFile('file'))
            {
                return redirect()->back()->withErrors(['Video Not Found']);
            }

            $data = $request->get('data');
            $video = $request->file('file');
            
            

            $validation = $this->videoValidator->storeGoogle($data, $video);
            if($validation)
            {
                return $this->errorWrongArgs($validation['errors']);
            }
            
            $extension = $video->extension();
            $imageName = date('dmyHis') . $this->helper->addUuid() . '.' . $extension;
            $video->move('video' , $imageName);
            //$Client = new Client('tyyJR1VDZKAAAAAAAAAE99P1cxgDW-uEBEJn3myW0mDCfXNEDhDsh55_uDBuIpTL');
            $filename = public_path('/video/' . $imageName);
            
            $pathToLocalFile = $filename;
            
            $app = new DropboxApp($dropboxCredentials['client_id'], $dropboxCredentials['client_secret'], $dropboxCredentials['access_token']);
            $dropbox = new Dropbox($app);
            
            $dropboxFile = new DropboxFile($pathToLocalFile);
            $file = $dropbox->upload($dropboxFile, "/" . $imageName, ['autorename' => true]);

            //Uploaded File
            $name = trim((string)$file->getName());
            $remotePath = '/' . ltrim($name != '' ? $name : $imageName, '/');

            $dropbox = new Dropbox($app);

            $response = $dropbox->postToAPI("/sharing/create_shared_link_with_settings", [
                "path" => $remotePath
            ]);

            $data1 = $response->getDecodedBody();
            $dropboxSharedUrl = trim((string)($data1['url'] ?? ''));
            $dropboxPlaybackUrl = $this->buildDropboxDirectPlaybackUrl($dropboxSharedUrl);
            if($dropboxPlaybackUrl == '')
            {
                $dropboxPlaybackUrl = $dropboxSharedUrl;
            }

            $resolvedDefaults = $this->resolveDefaultPrivacyAndChannel((string)$request->get('id', ''));
            $privacyOption = $resolvedDefaults['privacyOption'];
            $channel = $resolvedDefaults['channel'];
            if(!$privacyOption || !$channel)
            {
                return redirect()->back()->withErrors(['Unable to resolve channel/privacy for upload']);
            }
                
            $data['uuid'] = $this->helper->addUuid();;
            $data['type'] = 'DropBox';
            $data['url'] = $dropboxPlaybackUrl;
            $data['user_id'] = $request->get('id');
            $data['channel_id'] = $this->resolveChannelUuid($data['channel_id'] ?? '', $channel);
            $data['privacy_option_id'] = $this->resolvePrivacyOptionUuid($data['privacy_option_id'] ?? '', $privacyOption);
            $data['active'] = 1;
            $data['admin_active'] = 1;

            if($data['channel_id'] == '' || $data['privacy_option_id'] == '')
            {
                return redirect()->back()->withErrors(['Unable to resolve channel/privacy for upload']);
            }

            if(File::exists($pathToLocalFile))
            {
                File::delete($pathToLocalFile);
            }

            $upload = $this->video->create($data);
            if($upload)
            {
                return redirect('/api/v1/video/dropbox/upload/get?token=' . Session::get('clientToken') . '&client_id=' . Session::get('clientID'))->withErrors(['Video Uploaded Successfully']);
            }
            else
            {
                return redirect('/api/v1/video/dropbox/upload/get?token=' . Session::get('clientToken') . '&client_id=' . Session::get('clientID'))->withErrors(['Somethiong Went Wrong']);
            }
        }

        public function dropboxLinkIngestUpload(Request $request)
        {
            if(!$request->exists('data'))
            {
                return $this->errorWrongArgs(['No Input found']);
            }

            $payload = $request->get('data');
            $sourceUrl = trim((string)($payload['source_url'] ?? $payload['url'] ?? ''));
            if($sourceUrl == '')
            {
                return $this->errorWrongArgs(['Source URL is required']);
            }

            if(!filter_var($sourceUrl, FILTER_VALIDATE_URL))
            {
                return $this->errorWrongArgs(['Source URL is invalid']);
            }

            $user = $this->user->find($request->get('id'));
            if(!$user)
            {
                return $this->errorWrongArgs(['User not found']);
            }

            $errors = array();
            $dropboxCredentials = $this->resolveDropboxCredentials($user);
            if($dropboxCredentials['client_id'] == '')
            {
                $errors[] = 'DropBox Key Not Found for this user';
            }
            if($dropboxCredentials['client_secret'] == '')
            {
                $errors[] = 'DropBox Secret Not Found for this user';
            }
            if($dropboxCredentials['access_token'] == '')
            {
                $errors[] = 'DropBox Access Token Not Found for this user';
            }

            if(!empty($errors))
            {
                return $this->errorWrongArgs($errors);
            }

            $downloadResult = $this->downloadSourceVideoToLocalPath($sourceUrl);
            if(!$downloadResult['success'])
            {
                return $this->errorWrongArgs([$downloadResult['message']]);
            }

            $downloadedPath = $downloadResult['path'];
            $storedFilename = '';
            $publicPath = '';

            try {
                $extension = pathinfo($downloadedPath, PATHINFO_EXTENSION);
                if($extension == '')
                {
                    $extension = 'mp4';
                }

                $storedFilename = date('dmyHis') . $this->helper->addUuid() . '.' . $extension;

                if(!File::exists(public_path('video')))
                {
                    File::makeDirectory(public_path('video'), 0755, true);
                }

                $publicPath = public_path('video/' . $storedFilename);
                File::copy($downloadedPath, $publicPath);

                $app = new DropboxApp($dropboxCredentials['client_id'], $dropboxCredentials['client_secret'], $dropboxCredentials['access_token']);
                $dropbox = new Dropbox($app);
                $dropboxFile = new DropboxFile($publicPath);
                $uploaded = $dropbox->upload($dropboxFile, '/' . $storedFilename, ['autorename' => true]);

                $uploadedName = trim((string)($uploaded ? $uploaded->getName() : ''));
                $remotePath = '/' . ltrim($uploadedName != '' ? $uploadedName : $storedFilename, '/');

                $response = $dropbox->postToAPI('/sharing/create_shared_link_with_settings', [
                    'path' => $remotePath
                ]);
                $sharedLinkData = $response->getDecodedBody();
                $dropboxSharedUrl = trim((string)($sharedLinkData['url'] ?? ''));
                $dropboxPlaybackUrl = $this->buildDropboxDirectPlaybackUrl($dropboxSharedUrl);
                if($dropboxPlaybackUrl == '')
                {
                    $dropboxPlaybackUrl = $dropboxSharedUrl;
                }

                $resolvedDefaults = $this->resolveDefaultPrivacyAndChannel((string)$request->get('id', ''));
                $privacyOption = $resolvedDefaults['privacyOption'];
                $channel = $resolvedDefaults['channel'];
                if(!$privacyOption || !$channel)
                {
                    return $this->errorWrongArgs(['Unable to resolve channel/privacy options for ingest upload']);
                }

                $videoData = is_array($payload) ? $payload : array();
                $videoData = $this->helper->clearEmptyValues($videoData);
                unset($videoData['source_url']);

                if(!isset($videoData['name']) || trim($videoData['name']) == '')
                {
                    $videoData['name'] = 'Ingested URL - ' . $sourceUrl;
                }

                $videoData['uuid'] = $this->helper->addUuid();
                $videoData['type'] = 'DropBox';
                $videoData['url'] = $dropboxPlaybackUrl;
                $videoData['user_id'] = $request->get('id');
                $videoData['channel_id'] = $this->resolveChannelUuid($videoData['channel_id'] ?? '', $channel);
                $videoData['privacy_option_id'] = $this->resolvePrivacyOptionUuid($videoData['privacy_option_id'] ?? '', $privacyOption);
                $videoData['active'] = 1;
                $videoData['admin_active'] = 1;

                if($videoData['channel_id'] == '' || $videoData['privacy_option_id'] == '')
                {
                    return $this->errorWrongArgs(['Unable to resolve channel/privacy options for ingest upload']);
                }

                $video = $this->video->create($videoData);
                if(!$video)
                {
                    return $this->errorUnknown('Unable to save ingested video');
                }

                return $this->respondWithItem($video, new VideoTransformer());
            }
            catch (\Throwable $e)
            {
                return $this->errorWrongArgs(['Unable to ingest source URL: ' . $e->getMessage()]);
            }
            finally
            {
                if($downloadedPath != '' && File::exists($downloadedPath))
                {
                    File::delete($downloadedPath);
                }
                if($publicPath != '' && File::exists($publicPath))
                {
                    File::delete($publicPath);
                }
            }
        }

        private function downloadSourceVideoToLocalPath($sourceUrl)
        {
            $host = strtolower((string)parse_url($sourceUrl, PHP_URL_HOST));
            $isYouTube = (strpos($host, 'youtube.com') !== false) || (strpos($host, 'youtu.be') !== false);
            $isFacebook = (strpos($host, 'facebook.com') !== false) || (strpos($host, 'fb.watch') !== false);

            if($isYouTube || $isFacebook)
            {
                return $this->downloadUsingYtDlp($sourceUrl);
            }

            return $this->downloadDirectVideoUrl($sourceUrl);
        }

        private function ensureIngestTempDirectory()
        {
            $directory = storage_path('app/video-ingest-temp');
            if(!File::exists($directory))
            {
                File::makeDirectory($directory, 0755, true);
            }

            return $directory;
        }

        private function downloadUsingYtDlp($sourceUrl)
        {
            if(!function_exists('exec'))
            {
                return [
                    'success' => false,
                    'path' => '',
                    'message' => 'Server does not allow process execution required for YouTube/Facebook ingestion',
                ];
            }

            $tempDir = $this->ensureIngestTempDirectory();
            $baseName = 'ingest_' . date('YmdHis') . '_' . str_replace('-', '', $this->helper->addUuid());
            $outputTemplate = $tempDir . DIRECTORY_SEPARATOR . $baseName . '.%(ext)s';

            $commands = [
                'yt-dlp -f "bv*+ba/b" --merge-output-format mp4 --no-playlist -o ' . escapeshellarg($outputTemplate) . ' ' . escapeshellarg($sourceUrl) . ' 2>&1',
                'python -m yt_dlp -f "bv*+ba/b" --merge-output-format mp4 --no-playlist -o ' . escapeshellarg($outputTemplate) . ' ' . escapeshellarg($sourceUrl) . ' 2>&1',
                'python3 -m yt_dlp -f "bv*+ba/b" --merge-output-format mp4 --no-playlist -o ' . escapeshellarg($outputTemplate) . ' ' . escapeshellarg($sourceUrl) . ' 2>&1',
            ];

            $lastErrorOutput = '';
            foreach($commands as $command)
            {
                $output = [];
                $exitCode = 1;
                @exec($command, $output, $exitCode);

                $files = glob($tempDir . DIRECTORY_SEPARATOR . $baseName . '.*');
                $files = array_values(array_filter($files ?: [], function($filePath) {
                    return is_file($filePath)
                        && !preg_match('/\.(part|ytdl|temp)$/i', $filePath);
                }));

                if($exitCode === 0 && !empty($files))
                {
                    usort($files, function($a, $b) {
                        return filesize($b) <=> filesize($a);
                    });

                    return [
                        'success' => true,
                        'path' => $files[0],
                        'message' => '',
                    ];
                }

                $lastErrorOutput = trim(implode("\n", $output));
            }

            return [
                'success' => false,
                'path' => '',
                'message' => 'Unable to download external video. Ensure yt-dlp is installed on server. ' . $lastErrorOutput,
            ];
        }

        private function inferExtensionFromContentType($contentType)
        {
            $map = [
                'video/mp4' => 'mp4',
                'video/webm' => 'webm',
                'video/ogg' => 'ogg',
                'video/quicktime' => 'mov',
                'video/x-msvideo' => 'avi',
                'video/x-matroska' => 'mkv',
                'application/octet-stream' => 'mp4',
            ];

            $normalized = strtolower(trim((string)$contentType));
            if($normalized == '')
            {
                return 'mp4';
            }

            foreach($map as $prefix => $extension)
            {
                if(strpos($normalized, $prefix) === 0)
                {
                    return $extension;
                }
            }

            return 'mp4';
        }

        private function looksLikeUuid($value)
        {
            return (bool)preg_match('/^[0-9a-fA-F-]{36}$/', trim((string)$value));
        }

        private function resolvePrivacyOptionUuid($rawValue, $defaultPrivacyOption = null)
        {
            $value = trim((string)$rawValue);
            if($value != '')
            {
                if($this->looksLikeUuid($value))
                {
                    return $value;
                }

                $matchedByName = $this->privacyOptions->findWhere(['name' => ucfirst(strtolower($value))])->first();
                if($matchedByName)
                {
                    return $matchedByName->uuid;
                }
            }

            return $defaultPrivacyOption ? (string)$defaultPrivacyOption->uuid : '';
        }

        private function resolveChannelUuid($rawValue, $defaultChannel = null)
        {
            $value = trim((string)$rawValue);
            if($value != '')
            {
                if($this->looksLikeUuid($value))
                {
                    return $value;
                }

                $matchedByName = $this->channel->findWhere(['name' => $value])->first();
                if(!$matchedByName)
                {
                    $matchedByName = $this->channel->findWhere(['name' => ucfirst(strtolower($value))])->first();
                }
                if($matchedByName)
                {
                    return $matchedByName->uuid;
                }
            }

            return $defaultChannel ? (string)$defaultChannel->uuid : '';
        }

        private function resolveDropboxCredentials($user = null)
        {
            $userClientId = '';
            $userClientSecret = '';
            $userAccessToken = '';

            if($user)
            {
                $userClientId = trim((string)($user->dropbox_key ?? ''));
                $userClientSecret = trim((string)($user->dropbox_secret ?? ''));
                $userAccessToken = trim((string)($user->dropbox_access_token ?? ''));
            }

            return [
                'client_id' => $userClientId != ''
                    ? $userClientId
                    : trim((string)env('DROPBOX_CLIENT_ID', '')),
                'client_secret' => $userClientSecret != ''
                    ? $userClientSecret
                    : trim((string)env('DROPBOX_CLIENT_SECRET', '')),
                'access_token' => $userAccessToken != ''
                    ? $userAccessToken
                    : trim((string)env('DROPBOX_ACCESS_TOKEN', '')),
            ];
        }

        private function buildDropboxDirectPlaybackUrl($sharedUrl)
        {
            $url = trim((string)$sharedUrl);
            if($url == '')
            {
                return '';
            }

            $parsed = parse_url($url);
            if(!is_array($parsed))
            {
                return $url;
            }

            $host = strtolower(trim((string)($parsed['host'] ?? '')));
            $scheme = trim((string)($parsed['scheme'] ?? 'https'));
            $path = trim((string)($parsed['path'] ?? ''));
            if($path == '')
            {
                return $url;
            }

            if($host == 'dl.dropboxusercontent.com')
            {
                return $url;
            }

            if($host == '' || strpos($host, 'dropbox.com') === false)
            {
                return $url;
            }

            $query = [];
            parse_str((string)($parsed['query'] ?? ''), $query);
            if(!is_array($query))
            {
                $query = [];
            }

            unset($query['dl']);
            $query['raw'] = '1';

            $queryString = http_build_query($query);

            return $scheme
                . '://dl.dropboxusercontent.com'
                . $path
                . ($queryString != '' ? ('?' . $queryString) : '');
        }

        private function uploadFileToDropboxStorage($localFilePath, $user = null)
        {
            $filePath = trim((string)$localFilePath);
            if($filePath == '' || !File::exists($filePath))
            {
                return [
                    'success' => false,
                    'storageUrl' => '',
                    'playbackUrl' => '',
                    'error' => 'Invalid local file for Dropbox upload',
                ];
            }

            $dropboxCredentials = $this->resolveDropboxCredentials($user);
            if($dropboxCredentials['client_id'] == ''
                || $dropboxCredentials['client_secret'] == ''
                || $dropboxCredentials['access_token'] == '')
            {
                return [
                    'success' => false,
                    'storageUrl' => '',
                    'playbackUrl' => '',
                    'error' => 'Missing Dropbox client/app credentials',
                ];
            }

            $filename = trim((string)pathinfo($filePath, PATHINFO_BASENAME));
            if($filename == '')
            {
                $filename = date('YmdHis') . '_' . str_replace('-', '', $this->helper->addUuid()) . '.mp4';
            }

            try {
                $app = new DropboxApp(
                    $dropboxCredentials['client_id'],
                    $dropboxCredentials['client_secret'],
                    $dropboxCredentials['access_token']
                );
                $dropbox = new Dropbox($app);

                $dropboxFile = new DropboxFile($filePath);
                $uploaded = $dropbox->upload($dropboxFile, '/' . ltrim($filename, '/'), ['autorename' => true]);

                $uploadedName = trim((string)($uploaded ? $uploaded->getName() : ''));
                $remotePath = '/' . ltrim($uploadedName != '' ? $uploadedName : $filename, '/');

                $dropboxSharedUrl = '';
                try {
                    $response = $dropbox->postToAPI('/sharing/create_shared_link_with_settings', [
                        'path' => $remotePath,
                    ]);

                    $decoded = $response->getDecodedBody();
                    $dropboxSharedUrl = trim((string)($decoded['url'] ?? ''));
                }
                catch (\Throwable $ignoredSharedLinkException)
                {
                    $dropboxSharedUrl = '';
                }

                $dropboxPlaybackUrl = $this->buildDropboxDirectPlaybackUrl($dropboxSharedUrl);
                if($dropboxPlaybackUrl == '')
                {
                    $dropboxPlaybackUrl = $dropboxSharedUrl;
                }

                return [
                    'success' => ($dropboxPlaybackUrl != '' || $dropboxSharedUrl != ''),
                    'storageUrl' => $dropboxPlaybackUrl != '' ? $dropboxPlaybackUrl : $dropboxSharedUrl,
                    'playbackUrl' => $dropboxPlaybackUrl != '' ? $dropboxPlaybackUrl : $dropboxSharedUrl,
                    'error' => '',
                ];
            }
            catch (\Throwable $e)
            {
                return [
                    'success' => false,
                    'storageUrl' => '',
                    'playbackUrl' => '',
                    'error' => $e->getMessage(),
                ];
            }
        }

        private function downloadDirectVideoUrl($sourceUrl)
        {
            if(!function_exists('curl_init'))
            {
                return [
                    'success' => false,
                    'path' => '',
                    'message' => 'cURL extension is required for direct video ingestion',
                ];
            }

            $tempDir = $this->ensureIngestTempDirectory();
            $baseName = 'ingest_' . date('YmdHis') . '_' . str_replace('-', '', $this->helper->addUuid());

            $parsedPath = (string)parse_url($sourceUrl, PHP_URL_PATH);
            $extension = strtolower(pathinfo($parsedPath, PATHINFO_EXTENSION));
            if($extension == '')
            {
                $extension = 'mp4';
            }

            $tempPath = $tempDir . DIRECTORY_SEPARATOR . $baseName . '.' . $extension;
            $fileHandle = @fopen($tempPath, 'w+b');
            if(!$fileHandle)
            {
                return [
                    'success' => false,
                    'path' => '',
                    'message' => 'Unable to create temporary file for ingestion',
                ];
            }

            $ch = curl_init($sourceUrl);
            curl_setopt($ch, CURLOPT_FILE, $fileHandle);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_MAXREDIRS, 10);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
            curl_setopt($ch, CURLOPT_TIMEOUT, 300);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; VideoIngestBot/1.0)');

            $ok = curl_exec($ch);
            $curlError = curl_error($ch);
            $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $contentType = (string)curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
            curl_close($ch);
            fclose($fileHandle);

            if($ok === false)
            {
                if(File::exists($tempPath))
                {
                    File::delete($tempPath);
                }

                return [
                    'success' => false,
                    'path' => '',
                    'message' => 'Direct download failed: ' . $curlError,
                ];
            }

            if($httpCode >= 400)
            {
                if(File::exists($tempPath))
                {
                    File::delete($tempPath);
                }

                return [
                    'success' => false,
                    'path' => '',
                    'message' => 'Source returned HTTP status ' . $httpCode,
                ];
            }

            if(!File::exists($tempPath) || filesize($tempPath) <= 0)
            {
                if(File::exists($tempPath))
                {
                    File::delete($tempPath);
                }

                return [
                    'success' => false,
                    'path' => '',
                    'message' => 'Downloaded source file is empty',
                ];
            }

            if($contentType != ''
                && stripos($contentType, 'video/') !== 0
                && stripos($contentType, 'application/octet-stream') !== 0)
            {
                File::delete($tempPath);

                return [
                    'success' => false,
                    'path' => '',
                    'message' => 'Source URL is not a downloadable video stream',
                ];
            }

            if(pathinfo($tempPath, PATHINFO_EXTENSION) == '' || pathinfo($tempPath, PATHINFO_EXTENSION) == 'mp4')
            {
                $resolvedExtension = $this->inferExtensionFromContentType($contentType);
                $resolvedPath = $tempDir . DIRECTORY_SEPARATOR . $baseName . '.' . $resolvedExtension;
                if(strtolower($resolvedPath) != strtolower($tempPath))
                {
                    @rename($tempPath, $resolvedPath);
                    if(File::exists($resolvedPath))
                    {
                        $tempPath = $resolvedPath;
                    }
                }
            }

            return [
                'success' => true,
                'path' => $tempPath,
                'message' => '',
            ];
        }
        
        public function youtubeFileUpload(Request $request)
        {
            if($request->exists('id'))
            {
                $id = $request->get('id');
                $request->session()->put('idValue', $id);
            }
            
            $id = $request->session()->get('idValue');
            $user = $this->user->find($id);
            
            
            if(!$request->session()->has('videoUUID'))
            {
                if (!$request->hasFile('file'))
                {
                    return redirect()->back()->withErrors(['Video Not Found']);
                }
                $data = $request->get('data');
                $video = $request->file('file');

                $validation = $this->videoValidator->storeGoogle($data, $video);
                if($validation)
                {
                    return $this->errorWrongArgs($validation['errors']);
                }
                
                $errors = array();
                if($user->google_app_name == '')
                {
                    $errors[] = 'Google App Name Not Found for this user';
                }
                if($user->google_client_id == '')
                {
                    $errors[] = 'Google Client ID Not Found  for this user';
                }
                if($user->google_client_secret == '')
                {
                    $errors[] = 'Google Client Secret Not Found  for this user';
                }
                if($user->google_api_key == '')
                {
                    $errors[] = 'Google API Key Not Found  for this user';
                }

                if(!empty($errors))
                {
                    return redirect()->back()->withErrors($errors);
                }
                
                $privacyOption = $this->privacyOptions->findWhere(['name' => 'Public'])->first();
                $channel = $this->channel->findWhere(['name' => 'General'])->first();
                
                $extension = $video->extension();
                $imageName = date('dmyHis') . $this->helper->addUuid();
                //$request->session()->put('imageName', $imageName . '.' . $extension);
               // $path = $video->storeAs('/video/', $imageName . '.' . $extension);
                
                $video->move('video' , $imageName . '.' . $extension);
                $data = $this->helper->clearEmptyValues($data);
                $data['uuid'] = $this->helper->addUuid();
                $data['user_id'] = $request->get('id');
                $data['url'] = $imageName . '.' . $extension;
             //   $data['channel_id'] = $channel->uuid;
              //  $data['privacy_option_id'] = $privacyOption->uuid;
                $data['active'] = 1;
                $data['type'] = 'Youtube';
                
                $request->session()->put('videoUUID', $data['uuid']);
                $request->session()->put('clientToken', $request->get('token'));
                $request->session()->put('clientID', $request->get('client_id'));

                $videoResult = $this->video->create($data);
                if(!$videoResult)
                {
                    return redirect()->back()->withErrors(['Something Went Wrong']);
                }
            }
           
            $videoData = $this->video->findWhere(['uuid' => $request->session()->get('videoUUID')])->first();
            if(!$videoData)
            {
                return redirect()->back()->withErrors(['Video Not Uploaded']);
            }
           $OAUTH2_CLIENT_ID = $user->google_client_id;
           $OAUTH2_CLIENT_SECRET = $user->google_client_secret;

           $client = new Google_Client();
           $client->setClientId($OAUTH2_CLIENT_ID);
           $client->setClientSecret($OAUTH2_CLIENT_SECRET);
           $client->setScopes('https://www.googleapis.com/auth/youtube');
           $redirect = filter_var('http://' . $_SERVER['HTTP_HOST'] . '/api/v1/video/youtube/upload',
               FILTER_SANITIZE_URL);
           $client->setRedirectUri($redirect);
           
           // Define an object that will be used to make all API requests.
           $youtube = new Google_Service_YouTube($client);

           // Check if an auth token exists for the required scopes
           $tokenSessionKey = 'token-' . $client->prepareScopes();
          
           if (isset($_GET['code'])) {
             if (strval($request->session()->get('state')) !== strval($_GET['state'])) {
               die('The session state did not match.');
             }

             $client->authenticate($_GET['code']);
         //    $_SESSION[$tokenSessionKey] = $client->getAccessToken();
             $request->session()->put($tokenSessionKey, $client->getAccessToken());
             return redirect($redirect);
            // header('Location: ' . $redirect);
           }

           if ($request->session()->get($tokenSessionKey)) {
             $client->setAccessToken($request->session()->get($tokenSessionKey));
           }
          
           // Check to ensure that the access token was successfully acquired.
           if ($client->getAccessToken()) {
             $htmlBody = '';
             try{
               Session::forget('videoUUID');
               // REPLACE this value with the path to the file you are uploading.
               $videoPath = public_path('video/' . $videoData->url);

               // Create a snippet with title, description, tags and category ID
               // Create an asset resource and set its snippet metadata and type.
               // This example sets the video's title, description, keyword tags, and
               // video category.
               $snippet = new Google_Service_YouTube_VideoSnippet();
               $snippet->setTitle($videoData->name);
               $snippet->setDescription($videoData->description);
               
               //$snippet->setTags(array("tag1", "tag2"));

               // Numeric video category. See
               // https://developers.google.com/youtube/v3/docs/videoCategories/list
               //$snippet->setCategoryId("22");

               // Set the video's status to "public". Valid statuses are "public",
               // "private" and "unlisted".
               $status = new Google_Service_YouTube_VideoStatus();
               $status->privacyStatus = "public";

               // Associate the snippet and status objects with a new video resource.
               $video = new Google_Service_YouTube_Video();
               $video->setSnippet($snippet);
               $video->setStatus($status);

               // Specify the size of each chunk of data, in bytes. Set a higher value for
               // reliable connection as fewer chunks lead to faster uploads. Set a lower
               // value for better recovery on less reliable connections.
               $chunkSizeBytes = 1 * 1024 * 1024;

               // Setting the defer flag to true tells the client to return a request which can be called
               // with ->execute(); instead of making the API call immediately.
               $client->setDefer(true);

               // Create a request for the API's videos.insert method to create and upload the video.
               $insertRequest = $youtube->videos->insert("status,snippet,player", $video);

               // Create a MediaFileUpload object for resumable uploads.
               $media = new Google_Http_MediaFileUpload(
                   $client,
                   $insertRequest,
                   'video/*',
                   null,
                   true,
                   $chunkSizeBytes
               );
               $media->setFileSize(filesize($videoPath));
               

               // Read the media file and upload it chunk by chunk.
               $status = false;
               $handle = fopen($videoPath, "rb");
               while (!$status && !feof($handle)) {
                 $chunk = fread($handle, $chunkSizeBytes);
                 $status = $media->nextChunk($chunk);
               }
               
               fclose($handle);

               // If you want to make other calls after the file upload, set setDefer back to false
               $client->setDefer(false);
               File::delete(public_path('video/' . $videoData->url));
               $videoUpdateData['url'] = $status->id;
               $update = $this->video->updateData($videoUpdateData, $videoData->uuid);
                if(!$update)
                {
                    return 0;
                    exit;
                }
               return redirect('/api/v1/video/youtube/upload/get')->withErrors(['Video Uploaded Successfully']);

             } catch (Google_Service_Exception $e) {
                 return redirect('/api/v1/video/youtube/upload/get')->withErrors(['A service error occurred: <code>%s</code>' . $e->getMessage()]);
               //$htmlBody .= sprintf('<p>A service error occurred: <code>%s</code></p>',
                   //htmlspecialchars($e->getMessage()));
             } catch (Google_Exception $e) {
                 return redirect('/api/v1/video/youtube/upload/get')->withErrors(['A client error occurred: <code>%s</code>' . $e->getMessage()]);
               //$htmlBody .= sprintf('<p>An client error occurred: <code>%s</code></p>',
                  // htmlspecialchars($e->getMessage()));
             }

             $_SESSION[$tokenSessionKey] = $client->getAccessToken();
           } 
           elseif ($OAUTH2_CLIENT_ID == 'REPLACE_ME') {
               return redirect('/video/youtube/upload/get');
           }
           else
           {
                $state = mt_rand();
                $client->setState($state);
                $request->session()->put('state', $state);
                $authUrl = $client->createAuthUrl();
                
                return redirect($authUrl);
           }
        }

        public function oauthProviderConnect(Request $request, $provider)
        {
            $normalizedProvider = strtolower(trim((string)$provider));
            $supportedProviders = ['gdrive', 'dropbox', 'terabox', 'hetzner', 'idrive', 'drime', 'mega'];

            if(!in_array($normalizedProvider, $supportedProviders))
            {
                return $this->errorWrongArgs(['Unsupported storage provider']);
            }

            $user = $this->user->find($request->get('id'));
            if(!$user)
            {
                return $this->errorWrongArgs(['User not found']);
            }

            $providerLabels = [
                'gdrive' => 'Google Drive',
                'dropbox' => 'Dropbox',
                'terabox' => 'Terabox',
                'hetzner' => 'Hetzner Storage Box',
                'idrive' => 'IDrive',
                'drime' => 'Drime.cloud',
                'mega' => 'Mega',
            ];

            $token = (string)$request->get('token', '');
            $clientId = (string)$request->get('client_id', '');
            $connectionState = $this->resolveMigrationProviderConnectionState($user, $normalizedProvider);
            $oauthState = $this->generateProviderOAuthState($request->get('id'), $normalizedProvider, $token, $clientId);
            $oauthUrl = $this->buildProviderOAuthUrl($normalizedProvider, $user, $oauthState);
            $requiresOAuthWindow = ($oauthUrl != '' && (!$connectionState['connected'] || $normalizedProvider == 'hetzner'));

            return $this->respondWithData([
                'provider' => $normalizedProvider,
                'displayName' => isset($providerLabels[$normalizedProvider]) ? $providerLabels[$normalizedProvider] : ucfirst($normalizedProvider),
                'connected' => $connectionState['connected'],
                'requiresSetup' => !$connectionState['connected'],
                'requiresOAuthWindow' => $requiresOAuthWindow,
                'missingFields' => $connectionState['missing_fields'],
                'authUrl' => $connectionState['connected']
                    ? '/api/v1/storage/files?provider=' . rawurlencode($normalizedProvider)
                    . '&token=' . rawurlencode($token)
                    . '&client_id=' . rawurlencode($clientId)
                    : null,
                'oauthUrl' => $oauthUrl,
                'message' => $connectionState['message'],
            ]);
        }

        public function oauthProviderCallback(Request $request, $provider)
        {
            $normalizedProvider = strtolower(trim((string)$provider));
            $supportedProviders = ['dropbox'];
            if(!in_array($normalizedProvider, $supportedProviders, true))
            {
                return $this->errorWrongArgs(['Unsupported storage provider callback']);
            }

            $oauthCode = trim((string)$request->get('code', ''));
            $oauthState = trim((string)$request->get('state', ''));
            $oauthError = trim((string)$request->get('error', ''));
            if($oauthError != '')
            {
                return $this->redirectOAuthPopupResult(false, 'OAuth provider returned error: ' . $oauthError, [
                    'provider' => $normalizedProvider,
                ]);
            }

            if($oauthCode == '')
            {
                return $this->redirectOAuthPopupResult(false, 'Authorization code is required', [
                    'provider' => $normalizedProvider,
                ]);
            }

            $statePayload = $this->consumeProviderOAuthState($oauthState, $normalizedProvider);
            if(!$statePayload)
            {
                return $this->redirectOAuthPopupResult(false, 'OAuth state is invalid or expired. Please try connecting again.', [
                    'provider' => $normalizedProvider,
                ]);
            }

            $userId = trim((string)($statePayload['user_id'] ?? ''));
            if($userId == '')
            {
                return $this->redirectOAuthPopupResult(false, 'Unable to resolve user from OAuth state.', [
                    'provider' => $normalizedProvider,
                ]);
            }

            $user = $this->user->find($userId);
            if(!$user)
            {
                return $this->redirectOAuthPopupResult(false, 'User not found for OAuth callback.', [
                    'provider' => $normalizedProvider,
                ]);
            }

            if($normalizedProvider == 'dropbox')
            {
                try {
                    $dropboxClientId = trim((string)($user->dropbox_key ?? env('DROPBOX_CLIENT_ID', '')));
                    $dropboxClientSecret = trim((string)($user->dropbox_secret ?? env('DROPBOX_CLIENT_SECRET', '')));
                    $dropboxRedirectUri = trim((string)env('DROPBOX_REDIRECT_URI', ''));

                    if($dropboxClientId == '' || $dropboxClientSecret == '' || $dropboxRedirectUri == '')
                    {
                        return $this->redirectOAuthPopupResult(false, 'Dropbox OAuth is not fully configured. Missing client id/secret/redirect URI.', [
                            'provider' => $normalizedProvider,
                        ]);
                    }

                    $tokenResponse = Http::asForm()
                        ->acceptJson()
                        ->timeout(20)
                        ->post('https://api.dropboxapi.com/oauth2/token', [
                            'code' => $oauthCode,
                            'grant_type' => 'authorization_code',
                            'client_id' => $dropboxClientId,
                            'client_secret' => $dropboxClientSecret,
                            'redirect_uri' => $dropboxRedirectUri,
                        ]);

                    if(!$tokenResponse->successful())
                    {
                        $errorPayload = $tokenResponse->json();
                        $errorMessage = '';
                        if(is_array($errorPayload))
                        {
                            $errorMessage = trim((string)($errorPayload['error_description'] ?? $errorPayload['error_summary'] ?? $errorPayload['error'] ?? ''));
                        }
                        if($errorMessage == '')
                        {
                            $errorMessage = 'Dropbox token exchange failed with HTTP ' . $tokenResponse->status();
                        }

                        return $this->redirectOAuthPopupResult(false, $errorMessage, [
                            'provider' => $normalizedProvider,
                            'status' => (int)$tokenResponse->status(),
                        ]);
                    }

                    $tokenPayload = $tokenResponse->json();
                    $accessToken = is_array($tokenPayload) ? trim((string)($tokenPayload['access_token'] ?? '')) : '';
                    $refreshToken = is_array($tokenPayload) ? trim((string)($tokenPayload['refresh_token'] ?? '')) : '';
                    if($accessToken == '' && $refreshToken != '')
                    {
                        $accessToken = $refreshToken;
                    }
                    if($accessToken == '')
                    {
                        return $this->redirectOAuthPopupResult(false, 'Dropbox did not return an access token.', [
                            'provider' => $normalizedProvider,
                        ]);
                    }

                    $updated = $this->user->updateData([
                        'dropbox_access_token' => $accessToken,
                    ], $userId);

                    if(!$updated)
                    {
                        return $this->redirectOAuthPopupResult(false, 'Unable to save Dropbox token for this user.', [
                            'provider' => $normalizedProvider,
                        ]);
                    }

                    return $this->redirectOAuthPopupResult(true, 'Dropbox connected successfully.', [
                        'provider' => $normalizedProvider,
                    ]);
                }
                catch (\Throwable $e)
                {
                    return $this->redirectOAuthPopupResult(false, 'Dropbox OAuth callback failed: ' . $e->getMessage(), [
                        'provider' => $normalizedProvider,
                    ]);
                }
            }

            return $this->redirectOAuthPopupResult(false, 'Unsupported provider callback flow.', [
                'provider' => $normalizedProvider,
            ]);
        }

        public function saveOAuthApp(Request $request, $provider)
        {
            $normalizedProvider = strtolower(trim((string)$provider));
            $supportedProviders = ['gdrive', 'dropbox', 'terabox', 'hetzner', 'idrive', 'drime', 'mega'];
            if(!in_array($normalizedProvider, $supportedProviders, true))
            {
                return $this->errorWrongArgs(['Unsupported storage provider']);
            }

            $user = $this->user->find($request->get('id'));
            if(!$user)
            {
                return $this->errorWrongArgs(['User not found']);
            }

            $rawData = $request->get('data');
            $payload = is_array($rawData) ? $rawData : [];
            if(empty($payload))
            {
                return $this->errorWrongArgs(['OAuth app data is required']);
            }

            $requiredFieldsMap = [
                'gdrive' => ['google_client_id', 'google_client_secret', 'google_api_key'],
                'dropbox' => ['dropbox_key', 'dropbox_secret', 'dropbox_access_token'],
                'idrive' => ['idrive_client_id', 'idrive_client_secret', 'idrive_access_token'],
                'drime' => ['drime_client_id', 'drime_client_secret', 'drime_access_token'],
                'terabox' => ['terabox_ndus', 'terabox_js_token'],
                'hetzner' => ['hetzner_storage_base_url', 'hetzner_storage_username', 'hetzner_storage_password'],
                'mega' => ['mega_email', 'mega_password'],
            ];

            $requiredFields = isset($requiredFieldsMap[$normalizedProvider]) ? $requiredFieldsMap[$normalizedProvider] : [];
            if(empty($requiredFields))
            {
                return $this->errorWrongArgs(['OAuth app mapping is not configured for this provider']);
            }

            $normalizedData = [];
            foreach($requiredFields as $field)
            {
                $normalizedData[$field] = trim((string)($payload[$field] ?? ''));
            }

            $missingFields = [];
            foreach($normalizedData as $field => $value)
            {
                if($value === '')
                {
                    $missingFields[] = $field;
                }
            }
            if(!empty($missingFields))
            {
                return $this->errorWrongArgs(['Missing required OAuth app fields: ' . implode(', ', $missingFields)]);
            }

            $userWritableFieldsByProvider = [
                'gdrive' => ['google_client_id', 'google_client_secret', 'google_api_key'],
                'dropbox' => ['dropbox_key', 'dropbox_secret', 'dropbox_access_token'],
            ];

            $updatedUserFields = [];
            $storedEnvFields = [];
            if(isset($userWritableFieldsByProvider[$normalizedProvider]))
            {
                foreach($userWritableFieldsByProvider[$normalizedProvider] as $field)
                {
                    $updatedUserFields[$field] = $normalizedData[$field];
                }
            }
            else
            {
                foreach($normalizedData as $field => $value)
                {
                    $storedEnvFields[] = strtoupper($field);
                }
            }

            if(!empty($updatedUserFields))
            {
                $updated = $this->user->updateData($updatedUserFields, $request->get('id'));
                if(!$updated)
                {
                    return $this->errorUnknown('Unable to persist OAuth app settings');
                }
            }

            $providerLabels = [
                'gdrive' => 'Google Drive',
                'dropbox' => 'Dropbox',
                'terabox' => 'Terabox',
                'hetzner' => 'Hetzner Storage Box',
                'idrive' => 'IDrive',
                'drime' => 'Drime.cloud',
                'mega' => 'Mega',
            ];

            $refreshedUser = $this->user->find($request->get('id'));
            $connectionState = $this->resolveMigrationProviderConnectionState($refreshedUser ?: $user, $normalizedProvider);

            return $this->respondWithData([
                'provider' => $normalizedProvider,
                'displayName' => isset($providerLabels[$normalizedProvider]) ? $providerLabels[$normalizedProvider] : ucfirst($normalizedProvider),
                'saved' => true,
                'connected' => $connectionState['connected'],
                'missingFields' => $connectionState['missing_fields'],
                'storedOn' => !empty($updatedUserFields) ? 'user' : 'env-required',
                'savedFields' => array_keys($normalizedData),
                'envFields' => $storedEnvFields,
                'message' => !empty($updatedUserFields)
                    ? 'OAuth app credentials saved.'
                    : 'OAuth app values validated. This provider currently reads credentials from environment variables; update server env with the same values.',
            ]);
        }

        public function storageFiles(Request $request)
        {
            $provider = strtolower(trim((string)$request->get('provider', '')));
            $supportedProviders = ['gdrive', 'dropbox', 'terabox', 'hetzner', 'idrive', 'drime', 'mega'];

            if($provider == '' || !in_array($provider, $supportedProviders))
            {
                return $this->errorWrongArgs(['Provider is required']);
            }

            $user = $this->user->find($request->get('id'));
            if(!$user)
            {
                return $this->errorWrongArgs(['User not found']);
            }

            $connectionState = $this->resolveMigrationProviderConnectionState($user, $provider);
            if(!$connectionState['connected'])
            {
                return $this->errorWrongArgs([$connectionState['message']]);
            }

            $providerLabelMap = [
                'gdrive' => 'Google Drive',
                'dropbox' => 'Dropbox',
                'terabox' => 'Terabox',
                'hetzner' => 'Hetzner Storage Box',
                'idrive' => 'IDrive',
                'drime' => 'Drime.cloud',
                'mega' => 'Mega',
            ];

            $providerLabel = isset($providerLabelMap[$provider]) ? $providerLabelMap[$provider] : ucfirst($provider);

            $files = $this->fetchExternalProviderFiles($provider, $providerLabel);
            if(empty($files))
            {
                if($provider == 'terabox')
                {
                    return $this->errorWrongArgs(['Terabox account session is invalid or expired (precreate/list reports user not login). Refresh TERABOX_NDUS and TERABOX_JS_TOKEN from an active Terabox web session.']);
                }

                if($provider == 'mega')
                {
                    return $this->errorWrongArgs(['Mega session login failed or returned no files. Verify MEGA_EMAIL, MEGA_PASSWORD, and optional MEGA_SECOND_FACTOR_CODE in backend environment.']);
                }

                $files = $this->buildFallbackProviderFiles($provider, $providerLabel);
            }

            return $this->respondWithData([
                'provider' => $provider,
                'files' => $files,
            ]);
        }

        public function storageUpload(Request $request)
        {
            $uploadedFiles = $request->allFiles();
            if(empty($uploadedFiles))
            {
                return $this->errorWrongArgs(['At least one video file is required']);
            }

            $ownerUserId = trim((string)$request->get('id'));
            $resolvedDefaults = $this->resolveDefaultPrivacyAndChannel($ownerUserId);
            $privacyOption = $resolvedDefaults['privacyOption'];
            $channel = $resolvedDefaults['channel'];

            if($ownerUserId == '' && $channel)
            {
                $ownerUserId = trim((string)$channel->user_id);
            }

            if(!$privacyOption || !$channel || $ownerUserId == '')
            {
                return $this->errorWrongArgs(['Required privacy/channel configuration is missing']);
            }

            $ownerUser = $this->user->find($ownerUserId);
            $preferredProvider = $this->resolvePreferredMigrationStorageProvider((string)$request->get('targetProvider', ''), $ownerUser);

            $allowedMimePrefixes = ['video/', 'application/octet-stream'];
            $maxBytes = 5 * 1024 * 1024 * 1024;
            $storedFiles = [];
            $flatUploadedFiles = [];

            foreach($uploadedFiles as $candidate)
            {
                if(is_array($candidate))
                {
                    foreach($candidate as $nested)
                    {
                        if($nested)
                        {
                            $flatUploadedFiles[] = $nested;
                        }
                    }
                    continue;
                }

                if($candidate)
                {
                    $flatUploadedFiles[] = $candidate;
                }
            }

            foreach($flatUploadedFiles as $uploadedFile)
            {
                if(!$uploadedFile || !$uploadedFile->isValid())
                {
                    continue;
                }

                $mimeType = strtolower((string)$uploadedFile->getMimeType());
                $isAllowedMime = false;
                foreach($allowedMimePrefixes as $prefix)
                {
                    if(strpos($mimeType, $prefix) === 0)
                    {
                        $isAllowedMime = true;
                        break;
                    }
                }

                if(!$isAllowedMime)
                {
                    return $this->errorWrongArgs(['Only video files are allowed']);
                }

                if((int)$uploadedFile->getSize() > $maxBytes)
                {
                    return $this->errorWrongArgs(['Video file exceeds 5GB limit']);
                }

                $extension = strtolower((string)$uploadedFile->getClientOriginalExtension());
                if($extension == '')
                {
                    $extension = 'mp4';
                }

                try {
                    $storedFilename = date('YmdHis') . $this->helper->addUuid() . '.' . $extension;
                    $uploadDirectory = public_path('video');
                    if(!File::exists($uploadDirectory))
                    {
                        File::makeDirectory($uploadDirectory, 0755, true);
                    }

                    $uploadedFile->move($uploadDirectory, $storedFilename);

                    $videoUrl = $storedFilename;
                    $playbackUrl = url('/video/' . $storedFilename);

                    if($preferredProvider == 'terabox')
                    {
                        $teraboxUpload = $this->uploadFileToTeraboxViaNodeBridge($uploadDirectory . DIRECTORY_SEPARATOR . $storedFilename);
                        if(!$teraboxUpload['success'])
                        {
                            if(File::exists($uploadDirectory . DIRECTORY_SEPARATOR . $storedFilename))
                            {
                                File::delete($uploadDirectory . DIRECTORY_SEPARATOR . $storedFilename);
                            }
                            $message = trim((string)($teraboxUpload['error'] ?? ''));
                            if(stripos($message, 'user not login') !== false)
                            {
                                $message = 'Terabox upload failed: session expired (user not login). Refresh TERABOX_NDUS and TERABOX_JS_TOKEN from active Terabox web login.';
                            }
                            if($message == '')
                            {
                                $message = 'Terabox upload failed. Video was not persisted locally because decentralized storage is required.';
                            }
                            return $this->errorWrongArgs([$message]);
                        }
                        if($teraboxUpload['success'])
                        {
                            if($teraboxUpload['storageUrl'] != '')
                            {
                                $videoUrl = $teraboxUpload['storageUrl'];
                            }
                            if($teraboxUpload['playbackUrl'] != '')
                            {
                                $playbackUrl = $teraboxUpload['playbackUrl'];
                            }

                            if(File::exists($uploadDirectory . DIRECTORY_SEPARATOR . $storedFilename))
                            {
                                File::delete($uploadDirectory . DIRECTORY_SEPARATOR . $storedFilename);
                            }
                        }
                    }
                    elseif($preferredProvider == 'hetzner')
                    {
                        $hetznerUpload = $this->uploadFileToHetznerStorage($uploadDirectory . DIRECTORY_SEPARATOR . $storedFilename, $storedFilename);
                        if(!$hetznerUpload['success'])
                        {
                            if(File::exists($uploadDirectory . DIRECTORY_SEPARATOR . $storedFilename))
                            {
                                File::delete($uploadDirectory . DIRECTORY_SEPARATOR . $storedFilename);
                            }

                            $message = trim((string)($hetznerUpload['error'] ?? ''));
                            if($message == '')
                            {
                                $message = 'Hetzner upload failed. Video was not persisted locally because decentralized storage is required.';
                            }
                            return $this->errorWrongArgs([$message]);
                        }

                        if($hetznerUpload['storageUrl'] != '')
                        {
                            $videoUrl = $hetznerUpload['storageUrl'];
                        }
                        if($hetznerUpload['playbackUrl'] != '')
                        {
                            $playbackUrl = $hetznerUpload['playbackUrl'];
                        }

                        if(File::exists($uploadDirectory . DIRECTORY_SEPARATOR . $storedFilename))
                        {
                            File::delete($uploadDirectory . DIRECTORY_SEPARATOR . $storedFilename);
                        }
                    }
                    elseif($preferredProvider == 'dropbox')
                    {
                        $dropboxUpload = $this->uploadFileToDropboxStorage($uploadDirectory . DIRECTORY_SEPARATOR . $storedFilename, $ownerUser);
                        if(!$dropboxUpload['success'])
                        {
                            if(File::exists($uploadDirectory . DIRECTORY_SEPARATOR . $storedFilename))
                            {
                                File::delete($uploadDirectory . DIRECTORY_SEPARATOR . $storedFilename);
                            }

                            $message = trim((string)($dropboxUpload['error'] ?? ''));
                            if($message == '')
                            {
                                $message = 'Dropbox upload failed. Video was not persisted locally because cloud storage is required.';
                            }

                            return $this->errorWrongArgs([$message]);
                        }

                        if($dropboxUpload['storageUrl'] != '')
                        {
                            $videoUrl = $dropboxUpload['storageUrl'];
                        }
                        if($dropboxUpload['playbackUrl'] != '')
                        {
                            $playbackUrl = $dropboxUpload['playbackUrl'];
                        }

                        if(File::exists($uploadDirectory . DIRECTORY_SEPARATOR . $storedFilename))
                        {
                            File::delete($uploadDirectory . DIRECTORY_SEPARATOR . $storedFilename);
                        }
                    }

                    $originalFilename = (string)$uploadedFile->getClientOriginalName();
                    $videoUuid = $this->helper->addUuid();
                    $videoData = [
                        'uuid' => $videoUuid,
                        'name' => trim(pathinfo($originalFilename, PATHINFO_FILENAME)) != ''
                            ? trim(pathinfo($originalFilename, PATHINFO_FILENAME))
                            : 'Uploaded Video',
                        'description' => '',
                        'type' => 'Migration Upload',
                        'url' => $videoUrl,
                        'active' => 1,
                        'admin_active' => 1,
                        'user_id' => $ownerUserId,
                        'privacy_option_id' => $privacyOption->uuid,
                        'channel_id' => $channel->uuid,
                    ];

                    $videoRecord = $this->video->create($videoData);
                    if(!$videoRecord)
                    {
                        return $this->errorUnknown('Unable to persist migrated upload');
                    }

                    $responsePlaybackUrl = $this->buildMigrationStreamUrl(
                        $videoUuid,
                        (string)$request->get('token', ''),
                        (string)$request->get('client_id', '')
                    );
                    if($responsePlaybackUrl == '')
                    {
                        $responsePlaybackUrl = $playbackUrl;
                    }

                    $storedFiles[] = [
                        'id' => $videoUuid,
                        'fileId' => $videoUuid,
                        'videoUuid' => $videoUuid,
                        'originalFilename' => $originalFilename,
                        'filename' => $storedFilename,
                        'mimeType' => $mimeType,
                        'size' => round(((float)$uploadedFile->getSize()) / (1024 * 1024), 2),
                        'playbackUrl' => $responsePlaybackUrl,
                    ];
                }
                catch (\Throwable $e)
                {
                    return $this->errorWrongArgs([
                        'Failed to process uploaded file "' . (string)$uploadedFile->getClientOriginalName() . '": ' . $e->getMessage()
                    ]);
                }
            }

            if(empty($storedFiles))
            {
                return $this->errorWrongArgs(['No valid files were uploaded']);
            }

            return $this->respondWithData([
                'files' => $storedFiles,
            ]);
        }

        public function storageUploadInit(Request $request)
        {
            $filename = trim((string)$request->get('filename', 'video.bin'));
            $mimeType = trim((string)$request->get('mimeType', 'application/octet-stream'));
            $totalChunks = max(1, (int)$request->get('totalChunks', 1));
            $totalSize = max(0, (int)$request->get('totalSize', 0));
            $targetProvider = trim((string)$request->get('targetProvider', ''));

            $uploadId = $this->helper->addUuid();
            $chunkDir = storage_path('app/migration-chunks/' . $uploadId);
            if(!File::exists($chunkDir))
            {
                File::makeDirectory($chunkDir, 0755, true);
            }

            $meta = [
                'uploadId' => $uploadId,
                'filename' => $filename,
                'mimeType' => $mimeType,
                'totalChunks' => $totalChunks,
                'totalSize' => $totalSize,
                'userId' => (string)$request->get('id'),
                'targetProvider' => $targetProvider,
                'createdAt' => date('c'),
            ];

            File::put($chunkDir . DIRECTORY_SEPARATOR . 'meta.json', json_encode($meta));

            return $this->respondWithData([
                'uploadId' => $uploadId,
                'chunkSize' => 64 * 1024,
            ]);
        }

        public function storageUploadChunk(Request $request)
        {
            $uploadId = trim((string)$request->get('uploadId', ''));
            $chunkIndex = (int)$request->get('chunkIndex', -1);

            if($uploadId == '' || $chunkIndex < 0)
            {
                return $this->errorWrongArgs(['uploadId and chunkIndex are required']);
            }

            if(!$request->hasFile('chunk'))
            {
                return $this->errorWrongArgs(['No chunk file uploaded']);
            }

            $chunkDir = storage_path('app/migration-chunks/' . $uploadId);
            if(!File::exists($chunkDir))
            {
                return $this->errorWrongArgs(['Invalid upload session']);
            }

            $chunkFile = $request->file('chunk');
            if(!$chunkFile || !$chunkFile->isValid())
            {
                return $this->errorWrongArgs(['Uploaded chunk is invalid']);
            }

            $chunkFile->move($chunkDir, 'chunk_' . $chunkIndex . '.part');

            return $this->respondWithData([
                'uploadId' => $uploadId,
                'chunkIndex' => $chunkIndex,
                'received' => true,
            ]);
        }

        public function storageUploadFinalize(Request $request)
        {
            $uploadId = trim((string)$request->get('uploadId', ''));
            if($uploadId == '')
            {
                return $this->errorWrongArgs(['uploadId is required']);
            }

            $chunkDir = storage_path('app/migration-chunks/' . $uploadId);
            $metaPath = $chunkDir . DIRECTORY_SEPARATOR . 'meta.json';
            if(!File::exists($chunkDir) || !File::exists($metaPath))
            {
                return $this->errorWrongArgs(['Upload session not found']);
            }

            $metaRaw = File::get($metaPath);
            $meta = json_decode($metaRaw, true);
            if(!is_array($meta))
            {
                return $this->errorWrongArgs(['Upload metadata is corrupted']);
            }

            $totalChunks = max(1, (int)($meta['totalChunks'] ?? 1));
            $filename = trim((string)($meta['filename'] ?? 'video.bin'));
            $mimeType = trim((string)($meta['mimeType'] ?? 'application/octet-stream'));

            $ownerUserId = trim((string)$request->get('id'));
            if($ownerUserId == '')
            {
                $ownerUserId = trim((string)($meta['userId'] ?? ''));
            }

            $resolvedDefaults = $this->resolveDefaultPrivacyAndChannel($ownerUserId);
            $privacyOption = $resolvedDefaults['privacyOption'];
            $channel = $resolvedDefaults['channel'];

            if($ownerUserId == '' && $channel)
            {
                $ownerUserId = trim((string)$channel->user_id);
            }

            if(!$privacyOption || !$channel || $ownerUserId == '')
            {
                return $this->errorWrongArgs(['Required privacy/channel configuration is missing']);
            }

            $ownerUser = $this->user->find($ownerUserId);
            $preferredProvider = $this->resolvePreferredMigrationStorageProvider(
                (string)$request->get('targetProvider', (string)($meta['targetProvider'] ?? '')),
                $ownerUser
            );

            $extension = strtolower((string)pathinfo($filename, PATHINFO_EXTENSION));
            if($extension == '')
            {
                $extension = 'mp4';
            }

            $uploadDirectory = public_path('video');
            if(!File::exists($uploadDirectory))
            {
                File::makeDirectory($uploadDirectory, 0755, true);
            }

            $storedFilename = date('YmdHis') . $this->helper->addUuid() . '.' . $extension;
            $targetPath = $uploadDirectory . DIRECTORY_SEPARATOR . $storedFilename;

            $targetHandle = fopen($targetPath, 'wb');
            if($targetHandle === false)
            {
                return $this->errorUnknown('Unable to prepare output file for chunk merge');
            }

            try {
                for($index = 0; $index < $totalChunks; $index++)
                {
                    $chunkPath = $chunkDir . DIRECTORY_SEPARATOR . 'chunk_' . $index . '.part';
                    if(!File::exists($chunkPath))
                    {
                        return $this->errorWrongArgs(['Missing uploaded chunk #' . $index]);
                    }

                    $chunkHandle = fopen($chunkPath, 'rb');
                    if($chunkHandle === false)
                    {
                        return $this->errorUnknown('Unable to read chunk #' . $index);
                    }

                    stream_copy_to_stream($chunkHandle, $targetHandle);
                    fclose($chunkHandle);
                }
            }
            finally
            {
                fclose($targetHandle);
            }

            $videoUrl = $storedFilename;
            $playbackUrl = url('/video/' . $storedFilename);

            if($preferredProvider == 'terabox')
            {
                $teraboxUpload = $this->uploadFileToTeraboxViaNodeBridge($targetPath);
                if(!$teraboxUpload['success'])
                {
                    if(File::exists($targetPath))
                    {
                        File::delete($targetPath);
                    }
                    File::deleteDirectory($chunkDir);
                    $message = trim((string)($teraboxUpload['error'] ?? ''));
                    if(stripos($message, 'user not login') !== false)
                    {
                        $message = 'Terabox upload failed: session expired (user not login). Refresh TERABOX_NDUS and TERABOX_JS_TOKEN from active Terabox web login.';
                    }
                    if($message == '')
                    {
                        $message = 'Terabox upload failed. Video was not persisted locally because decentralized storage is required.';
                    }
                    return $this->errorWrongArgs([$message]);
                }
                if($teraboxUpload['success'])
                {
                    if($teraboxUpload['storageUrl'] != '')
                    {
                        $videoUrl = $teraboxUpload['storageUrl'];
                    }
                    if($teraboxUpload['playbackUrl'] != '')
                    {
                        $playbackUrl = $teraboxUpload['playbackUrl'];
                    }

                    if(File::exists($targetPath))
                    {
                        File::delete($targetPath);
                    }
                }
            }
            elseif($preferredProvider == 'hetzner')
            {
                $hetznerUpload = $this->uploadFileToHetznerStorage($targetPath, $storedFilename);
                if(!$hetznerUpload['success'])
                {
                    if(File::exists($targetPath))
                    {
                        File::delete($targetPath);
                    }
                    File::deleteDirectory($chunkDir);

                    $message = trim((string)($hetznerUpload['error'] ?? ''));
                    if($message == '')
                    {
                        $message = 'Hetzner upload failed. Video was not persisted locally because decentralized storage is required.';
                    }
                    return $this->errorWrongArgs([$message]);
                }

                if($hetznerUpload['storageUrl'] != '')
                {
                    $videoUrl = $hetznerUpload['storageUrl'];
                }
                if($hetznerUpload['playbackUrl'] != '')
                {
                    $playbackUrl = $hetznerUpload['playbackUrl'];
                }

                if(File::exists($targetPath))
                {
                    File::delete($targetPath);
                }
            }
            elseif($preferredProvider == 'dropbox')
            {
                $dropboxUpload = $this->uploadFileToDropboxStorage($targetPath, $ownerUser);
                if(!$dropboxUpload['success'])
                {
                    if(File::exists($targetPath))
                    {
                        File::delete($targetPath);
                    }
                    File::deleteDirectory($chunkDir);

                    $message = trim((string)($dropboxUpload['error'] ?? ''));
                    if($message == '')
                    {
                        $message = 'Dropbox upload failed. Video was not persisted locally because cloud storage is required.';
                    }

                    return $this->errorWrongArgs([$message]);
                }

                if($dropboxUpload['storageUrl'] != '')
                {
                    $videoUrl = $dropboxUpload['storageUrl'];
                }
                if($dropboxUpload['playbackUrl'] != '')
                {
                    $playbackUrl = $dropboxUpload['playbackUrl'];
                }

                if(File::exists($targetPath))
                {
                    File::delete($targetPath);
                }
            }

            $videoUuid = $this->helper->addUuid();
            $videoData = [
                'uuid' => $videoUuid,
                'name' => trim(pathinfo($filename, PATHINFO_FILENAME)) != '' ? trim(pathinfo($filename, PATHINFO_FILENAME)) : 'Uploaded Video',
                'description' => '',
                'type' => 'Migration Upload',
                'url' => $videoUrl,
                'active' => 1,
                'admin_active' => 1,
                'user_id' => $ownerUserId,
                'privacy_option_id' => $privacyOption->uuid,
                'channel_id' => $channel->uuid,
            ];

            $videoRecord = $this->video->create($videoData);
            if(!$videoRecord)
            {
                return $this->errorUnknown('Unable to persist merged upload');
            }

            $responsePlaybackUrl = $this->buildMigrationStreamUrl(
                $videoUuid,
                (string)$request->get('token', ''),
                (string)$request->get('client_id', '')
            );
            if($responsePlaybackUrl == '')
            {
                $responsePlaybackUrl = $playbackUrl;
            }

            File::deleteDirectory($chunkDir);

            return $this->respondWithData([
                'files' => [[
                    'id' => $videoUuid,
                    'fileId' => $videoUuid,
                    'videoUuid' => $videoUuid,
                    'originalFilename' => $filename,
                    'filename' => $storedFilename,
                    'mimeType' => $mimeType,
                    'size' => round(((float)@filesize($targetPath)) / (1024 * 1024), 2),
                    'playbackUrl' => $responsePlaybackUrl,
                ]],
            ]);
        }

        private function resolveDefaultPrivacyAndChannel($userId = '')
        {
            $normalizedUserId = trim((string)$userId);

            $privacyOption = $this->privacyOptions->findWhere(['name' => 'Public'])->first();
            if(!$privacyOption)
            {
                $privacyOption = $this->privacyOptions->all()->first();
            }

            if(!$privacyOption)
            {
                $privacyOption = $this->privacyOptions->create([
                    'uuid' => $this->helper->addUuid(),
                    'name' => 'Public',
                    'description' => 'Auto-created default privacy option for migration uploads',
                ]);

                if(!$privacyOption)
                {
                    $privacyOption = $this->privacyOptions->all()->first();
                }
            }

            $channel = null;
            if($normalizedUserId != '')
            {
                $channel = $this->channel->findWhere([
                    'user_id' => $normalizedUserId,
                    'name' => 'General',
                ])->first();
            }

            if(!$channel)
            {
                $channel = $this->channel->findWhere(['name' => 'General'])->first();
            }

            if(!$channel && $normalizedUserId != '')
            {
                $channel = $this->channel->findWhere(['user_id' => $normalizedUserId])->first();
            }

            if(!$channel)
            {
                $channel = $this->channel->all()->first();
            }

            if(!$channel)
            {
                if($normalizedUserId == '')
                {
                    $fallbackUser = $this->user->all()->first();
                    if($fallbackUser)
                    {
                        $normalizedUserId = trim((string)$fallbackUser->uuid);
                    }
                }

                if($normalizedUserId != '' && $privacyOption)
                {
                    $channel = $this->channel->create([
                        'uuid' => $this->helper->addUuid(),
                        'name' => 'General',
                        'description' => 'Auto-created default channel for migration uploads',
                        'active' => 1,
                        'user_id' => $normalizedUserId,
                        'privacy_option_id' => $privacyOption->uuid,
                    ]);

                    if(!$channel)
                    {
                        $channel = $this->channel->findWhere([
                            'user_id' => $normalizedUserId,
                            'name' => 'General',
                        ])->first();
                    }
                }
            }

            return [
                'privacyOption' => $privacyOption,
                'channel' => $channel,
            ];
        }

        public function migrateBatch(Request $request)
        {
            $videos = $request->get('videos');
            if(!is_array($videos) || empty($videos))
            {
                return $this->errorWrongArgs(['No videos provided for migration']);
            }

            $results = [];
            foreach($videos as $video)
            {
                $videoId = '';
                $originalFilename = '';
                $incomingPlayback = '';

                if(is_array($video))
                {
                    $videoId = (string)(isset($video['id']) ? $video['id'] : (isset($video['videoId']) ? $video['videoId'] : (isset($video['sourceFileId']) ? $video['sourceFileId'] : '')));
                    $originalFilename = (string)(isset($video['originalFilename']) ? $video['originalFilename'] : '');
                    $incomingPlayback = (string)(isset($video['playbackUrl']) ? $video['playbackUrl'] : '');
                }

                $resolvedVideo = null;
                if($videoId != '' && $this->looksLikeUuid($videoId))
                {
                    $resolvedVideo = $this->video->findWhere([
                        'uuid' => $videoId,
                        'user_id' => $request->get('id'),
                    ])->first();
                }

                if(!$resolvedVideo && $originalFilename != '')
                {
                    $baseName = trim(pathinfo($originalFilename, PATHINFO_FILENAME));
                    if($baseName != '')
                    {
                        $resolvedVideo = $this->video->findWhere([
                            'user_id' => $request->get('id'),
                            'name' => $baseName,
                        ])->first();
                    }
                }

                $playbackUrl = $incomingPlayback;
                $resolvedId = $videoId;

                if($resolvedVideo)
                {
                    $resolvedId = (string)$resolvedVideo->uuid;
                    $resolvedPlayback = $this->resolveStoredVideoPlaybackUrl((string)$resolvedVideo->url, (string)$resolvedVideo->uuid);
                    if($resolvedPlayback != '')
                    {
                        $playbackUrl = $resolvedPlayback;
                    }
                }

                $results[] = [
                    'videoId' => $resolvedId,
                    'id' => $resolvedId,
                    'originalFilename' => $originalFilename,
                    'streamUrl' => $playbackUrl,
                    'playbackUrl' => $playbackUrl,
                    'status' => 'migrated',
                ];
            }

            return $this->respondWithData([
                'videos' => $results,
            ]);
        }

        private function resolvePreferredMigrationStorageProvider($rawProvider = '', $user = null)
        {
            $provider = strtolower(trim((string)$rawProvider));
            if($provider == '')
            {
                $provider = strtolower(trim((string)env('MIGRATION_UPLOAD_PROVIDER', 'hetzner')));
            }

            if($provider == 'dropbox')
            {
                $credentials = $this->resolveDropboxCredentials($user);
                if($credentials['client_id'] != '' && $credentials['client_secret'] != '' && $credentials['access_token'] != '')
                {
                    return 'dropbox';
                }

                return 'local';
            }

            if($provider == 'hetzner')
            {
                $baseUrl = trim((string)env('HETZNER_STORAGE_BASE_URL', ''));
                $username = trim((string)env('HETZNER_STORAGE_USERNAME', ''));
                $password = trim((string)env('HETZNER_STORAGE_PASSWORD', ''));
                if($baseUrl != '' && $username != '' && $password != '')
                {
                    return 'hetzner';
                }

                return 'local';
            }

            if($provider == 'terabox')
            {
                $ndus = trim((string)env('TERABOX_NDUS', ''));
                $jsToken = trim((string)env('TERABOX_JS_TOKEN', ''));
                if($ndus != '' && $jsToken != '')
                {
                    return 'terabox';
                }

                return 'local';
            }

            return 'local';
        }

        private function resolveStoredVideoPlaybackUrl($storedPath = '', $videoUuid = '')
        {
            $resolvedPath = trim((string)$storedPath);
            if($resolvedPath == '')
            {
                return '';
            }

            $proxyUrl = '';
            $resolvedUuid = trim((string)$videoUuid);
            if($resolvedUuid != '')
            {
                $proxyUrl = url('/api/v1/video/migration/stream/' . $resolvedUuid);
            }

            if(stripos($resolvedPath, 'terabox://') === 0)
            {
                if($proxyUrl != '')
                {
                    return $proxyUrl;
                }

                $fileId = trim((string)substr($resolvedPath, strlen('terabox://')));
                return $fileId != '' ? $this->fetchTeraboxDownloadLinkViaNodeBridge($fileId) : '';
            }

            if(stripos($resolvedPath, 'mega://') === 0)
            {
                if($proxyUrl != '')
                {
                    return $proxyUrl;
                }

                $nodeId = trim((string)substr($resolvedPath, strlen('mega://')));
                return $nodeId != '' ? $this->fetchMegaDownloadLinkViaNodeBridge($nodeId) : '';
            }

            if(stripos($resolvedPath, 'https://dl.dropboxusercontent.com/') === 0
                || stripos($resolvedPath, 'http://dl.dropboxusercontent.com/') === 0)
            {
                if($proxyUrl != '')
                {
                    return $proxyUrl;
                }

                return $resolvedPath;
            }

            if(stripos($resolvedPath, 'hetzner://') === 0)
            {
                $remotePath = trim((string)substr($resolvedPath, strlen('hetzner://')));
                if($remotePath == '')
                {
                    return '';
                }

                if($proxyUrl != '')
                {
                    return $proxyUrl;
                }

                return $this->buildHetznerFileUrl($remotePath);
            }

            if(stripos($resolvedPath, 'hetzner://') === 0)
            {
                $remotePath = trim((string)substr($resolvedPath, strlen('hetzner://')));
                if($remotePath == '')
                {
                    return '';
                }

                if($proxyUrl != '')
                {
                    return $proxyUrl;
                }

                return $this->buildHetznerFileUrl($remotePath);
            }

            if(stripos($resolvedPath, 'http://') === 0 || stripos($resolvedPath, 'https://') === 0)
            {
                if($proxyUrl != '')
                {
                    return $proxyUrl;
                }

                return $resolvedPath;
            }

            return url('/video/' . ltrim($resolvedPath, '/'));
        }

        private function buildMigrationStreamUrl($videoUuid = '', $token = '', $clientId = '')
        {
            $resolvedUuid = trim((string)$videoUuid);
            if($resolvedUuid == '')
            {
                return '';
            }

            $resolvedToken = trim((string)$token);
            $resolvedClientId = trim((string)$clientId);
            if($resolvedToken == '' || $resolvedClientId == '')
            {
                return '';
            }

            return url('/api/v1/video/migration/stream/' . $resolvedUuid) . '?' . http_build_query([
                'token' => $resolvedToken,
                'client_id' => $resolvedClientId,
            ]);
        }

        private function uploadFileToTeraboxViaNodeBridge($localFilePath)
        {
            $filePath = trim((string)$localFilePath);
            if($filePath == '' || !File::exists($filePath))
            {
                return [
                    'success' => false,
                    'storageUrl' => '',
                    'playbackUrl' => '',
                ];
            }

            $ndus = trim((string)env('TERABOX_NDUS', ''));
            $jsToken = trim((string)env('TERABOX_JS_TOKEN', ''));
            if($ndus == '' || $jsToken == '')
            {
                return [
                    'success' => false,
                    'storageUrl' => '',
                    'playbackUrl' => '',
                ];
            }

            $appId = trim((string)env('TERABOX_APP_ID', '250528'));
            $bdstoken = trim((string)env('TERABOX_BDSTOKEN', ''));
            $browserId = trim((string)env('TERABOX_BROWSER_ID', ''));
            $remoteDir = trim((string)env('TERABOX_REMOTE_DIR', '/'));
            $scriptPath = base_path('scripts/teraboxBridge.cjs');
            if(!File::exists($scriptPath))
            {
                return [
                    'success' => false,
                    'storageUrl' => '',
                    'playbackUrl' => '',
                ];
            }

            try {
                $args = [
                    'node',
                    $scriptPath,
                    '--mode', 'upload',
                    '--filePath', $filePath,
                    '--ndus', $ndus,
                    '--jsToken', $jsToken,
                    '--appId', ($appId == '' ? '250528' : $appId),
                    '--remoteDir', ($remoteDir == '' ? '/' : $remoteDir),
                ];

                if($bdstoken != '')
                {
                    $args[] = '--bdstoken';
                    $args[] = $bdstoken;
                }
                if($browserId != '')
                {
                    $args[] = '--browserId';
                    $args[] = $browserId;
                }

                $process = new Process($args, base_path());
                $process->setTimeout(600);
                $process->run();

                if(!$process->isSuccessful())
                {
                    $errorMessage = trim((string)$process->getErrorOutput());
                    $normalizedError = strtolower($errorMessage);
                    if(strpos($normalizedError, 'user not login') !== false || strpos($normalizedError, 'not login') !== false)
                    {
                        return [
                            'success' => false,
                            'storageUrl' => '',
                            'playbackUrl' => '',
                            'error' => 'Terabox session expired: user not login',
                        ];
                    }

                    return [
                        'success' => false,
                        'storageUrl' => '',
                        'playbackUrl' => '',
                        'error' => $errorMessage,
                    ];
                }

                $output = trim((string)$process->getOutput());
                if($output == '')
                {
                    return [
                        'success' => false,
                        'storageUrl' => '',
                        'playbackUrl' => '',
                        'error' => 'Empty Terabox bridge output',
                    ];
                }

                $payload = json_decode($output, true);
                if(!is_array($payload))
                {
                    return [
                        'success' => false,
                        'storageUrl' => '',
                        'playbackUrl' => '',
                        'error' => 'Invalid Terabox bridge output payload',
                    ];
                }

                $fileId = trim((string)($payload['fileId'] ?? ''));
                $storageUrl = trim((string)($payload['storageUrl'] ?? ''));
                $playbackUrl = trim((string)($payload['playbackUrl'] ?? ''));
                if($storageUrl == '' && $fileId != '')
                {
                    $storageUrl = 'terabox://' . $fileId;
                }

                return [
                    'success' => ($storageUrl != '' || $playbackUrl != ''),
                    'storageUrl' => $storageUrl,
                    'playbackUrl' => $playbackUrl,
                    'error' => '',
                ];
            }
            catch (\Throwable $e)
            {
                return [
                    'success' => false,
                    'storageUrl' => '',
                    'playbackUrl' => '',
                    'error' => $e->getMessage(),
                ];
            }
        }

        private function uploadFileToHetznerStorage($localFilePath, $remoteFileName)
        {
            $filePath = trim((string)$localFilePath);
            $filename = trim((string)$remoteFileName);
            if($filePath == '' || $filename == '' || !File::exists($filePath))
            {
                return [
                    'success' => false,
                    'storageUrl' => '',
                    'playbackUrl' => '',
                    'error' => 'Invalid local file for Hetzner upload',
                ];
            }

            $baseUrl = rtrim(trim((string)env('HETZNER_STORAGE_BASE_URL', '')), '/');
            $username = trim((string)env('HETZNER_STORAGE_USERNAME', ''));
            $password = trim((string)env('HETZNER_STORAGE_PASSWORD', ''));
            if($baseUrl == '' || $username == '' || $password == '')
            {
                return [
                    'success' => false,
                    'storageUrl' => '',
                    'playbackUrl' => '',
                    'error' => 'Missing Hetzner Storage Box credentials',
                ];
            }

            $remoteDir = trim((string)env('HETZNER_STORAGE_REMOTE_DIR', '/video'));
            if($remoteDir == '')
            {
                $remoteDir = '/video';
            }
            if(strpos($remoteDir, '/') !== 0)
            {
                $remoteDir = '/' . $remoteDir;
            }

            $remotePath = rtrim($remoteDir, '/') . '/' . ltrim($filename, '/');
            $uploadUrl = $this->buildHetznerFileUrl($remotePath);
            if($uploadUrl == '')
            {
                return [
                    'success' => false,
                    'storageUrl' => '',
                    'playbackUrl' => '',
                    'error' => 'Unable to construct Hetzner upload URL',
                ];
            }

            try {
                $fileBinary = File::get($filePath);
                $contentType = trim((string)mime_content_type($filePath));
                if($contentType == '')
                {
                    $contentType = 'application/octet-stream';
                }

                $putResponse = Http::withBasicAuth($username, $password)
                    ->withHeaders([
                        'Content-Type' => $contentType,
                    ])
                    ->timeout(120)
                    ->send('PUT', $uploadUrl, [
                        'body' => $fileBinary,
                    ]);

                if(!$putResponse->successful())
                {
                    return [
                        'success' => false,
                        'storageUrl' => '',
                        'playbackUrl' => '',
                        'error' => 'Hetzner upload failed with HTTP ' . $putResponse->status(),
                    ];
                }

                return [
                    'success' => true,
                    'storageUrl' => 'hetzner://' . ltrim($remotePath, '/'),
                    'playbackUrl' => $uploadUrl,
                    'error' => '',
                ];
            }
            catch (\Throwable $e)
            {
                return [
                    'success' => false,
                    'storageUrl' => '',
                    'playbackUrl' => '',
                    'error' => $e->getMessage(),
                ];
            }
        }

        private function buildHetznerOAuthUrl()
        {
            $clientId = trim((string)env('HETZNER_OAUTH_CLIENT_ID', ''));
            $authorizeBase = trim((string)env('HETZNER_OAUTH_AUTHORIZE_URL', ''));
            $redirectUri = trim((string)env('HETZNER_OAUTH_REDIRECT_URI', ''));
            $scope = trim((string)env('HETZNER_OAUTH_SCOPE', ''));

            if($clientId == '' || $authorizeBase == '' || $redirectUri == '')
            {
                return '';
            }

            $query = [
                'client_id' => $clientId,
                'redirect_uri' => $redirectUri,
                'response_type' => 'code',
            ];
            if($scope != '')
            {
                $query['scope'] = $scope;
            }

            try {
                $state = bin2hex(random_bytes(16));
            }
            catch (\Throwable $e)
            {
                $state = (string)time() . '_' . md5(uniqid('', true));
            }
            $query['state'] = $state;

            return $authorizeBase . (strpos($authorizeBase, '?') === false ? '?' : '&') . http_build_query($query);
        }

        private function buildHetznerFileUrl($remotePath = '')
        {
            $baseUrl = rtrim(trim((string)env('HETZNER_STORAGE_BASE_URL', '')), '/');
            $path = trim((string)$remotePath);
            if($baseUrl == '' || $path == '')
            {
                return '';
            }

            $segments = array_values(array_filter(explode('/', str_replace('\\', '/', $path)), function($value) {
                return trim((string)$value) != '';
            }));
            if(empty($segments))
            {
                return $baseUrl;
            }

            $encodedSegments = [];
            foreach($segments as $segment)
            {
                $encodedSegments[] = rawurlencode($segment);
            }

            return $baseUrl . '/' . implode('/', $encodedSegments);
        }

        private function fetchTeraboxDownloadLinkViaNodeBridge($fileId)
        {
            $resolvedFileId = trim((string)$fileId);
            if($resolvedFileId == '')
            {
                return '';
            }

            $ndus = trim((string)env('TERABOX_NDUS', ''));
            $jsToken = trim((string)env('TERABOX_JS_TOKEN', ''));
            if($ndus == '' || $jsToken == '')
            {
                return '';
            }

            $appId = trim((string)env('TERABOX_APP_ID', '250528'));
            $bdstoken = trim((string)env('TERABOX_BDSTOKEN', ''));
            $browserId = trim((string)env('TERABOX_BROWSER_ID', ''));
            $scriptPath = base_path('scripts/teraboxBridge.cjs');
            if(!File::exists($scriptPath))
            {
                return '';
            }

            try {
                $args = [
                    'node',
                    $scriptPath,
                    '--mode', 'download',
                    '--fileId', $resolvedFileId,
                    '--ndus', $ndus,
                    '--jsToken', $jsToken,
                    '--appId', ($appId == '' ? '250528' : $appId),
                ];

                if($bdstoken != '')
                {
                    $args[] = '--bdstoken';
                    $args[] = $bdstoken;
                }
                if($browserId != '')
                {
                    $args[] = '--browserId';
                    $args[] = $browserId;
                }

                $process = new Process($args, base_path());
                $process->setTimeout(40);
                $process->run();

                if(!$process->isSuccessful())
                {
                    return '';
                }

                $output = trim((string)$process->getOutput());
                if($output == '')
                {
                    return '';
                }

                $payload = json_decode($output, true);
                if(!is_array($payload))
                {
                    return '';
                }

                return trim((string)($payload['playbackUrl'] ?? ''));
            }
            catch (\Throwable $e)
            {
                return '';
            }
        }

        private function fetchMegaDownloadLinkViaNodeBridge($nodeId)
        {
            $resolvedNodeId = trim((string)$nodeId);
            if($resolvedNodeId == '')
            {
                return '';
            }

            $email = trim((string)env('MEGA_EMAIL', ''));
            $password = trim((string)env('MEGA_PASSWORD', ''));
            if($email == '' || $password == '')
            {
                return '';
            }

            $secondFactorCode = trim((string)env('MEGA_SECOND_FACTOR_CODE', ''));
            $scriptPath = base_path('scripts/megaBridge.cjs');
            if(!File::exists($scriptPath))
            {
                return '';
            }

            try {
                $args = [
                    'node',
                    $scriptPath,
                    '--mode', 'download',
                    '--nodeId', $resolvedNodeId,
                    '--email', $email,
                    '--password', $password,
                ];

                if($secondFactorCode != '')
                {
                    $args[] = '--secondFactorCode';
                    $args[] = $secondFactorCode;
                }

                $process = new Process($args, base_path());
                $process->setTimeout(45);
                $process->run();

                if(!$process->isSuccessful())
                {
                    return '';
                }

                $output = trim((string)$process->getOutput());
                if($output == '')
                {
                    return '';
                }

                $payload = json_decode($output, true);
                if(!is_array($payload))
                {
                    return '';
                }

                $candidates = [
                    trim((string)($payload['playbackUrl'] ?? '')),
                    trim((string)($payload['streamUrl'] ?? '')),
                    trim((string)($payload['downloadUrl'] ?? '')),
                    trim((string)($payload['publicLink'] ?? '')),
                ];

                foreach($candidates as $candidate)
                {
                    if($candidate != '')
                    {
                        return $candidate;
                    }
                }

                return '';
            }
            catch (\Throwable $e)
            {
                return '';
            }
        }

        public function migrationStream(Request $request, $id)
        {
            $videoUuid = trim((string)$id);
            if($videoUuid == '')
            {
                return $this->errorWrongArgs(['Video id is required']);
            }

            $video = $this->video->findWhere(['uuid' => $videoUuid])->first();
            if(!$video)
            {
                return $this->errorNotFound('Video not found');
            }

            $rawUrl = trim((string)$video->url);
            if($rawUrl == '')
            {
                return $this->errorNotFound('Video source not found');
            }

            if(stripos($rawUrl, 'terabox://') === 0)
            {
                $fileId = trim((string)substr($rawUrl, strlen('terabox://')));
                if($fileId == '')
                {
                    return $this->errorNotFound('Invalid Terabox file id');
                }

                $rawUrl = $this->fetchTeraboxDownloadLinkViaNodeBridge($fileId);
                if($rawUrl == '')
                {
                    return $this->errorUnknown('Unable to resolve Terabox playback link');
                }
            }
            elseif(stripos($rawUrl, 'mega://') === 0)
            {
                $nodeId = trim((string)substr($rawUrl, strlen('mega://')));
                if($nodeId == '')
                {
                    return $this->errorNotFound('Invalid Mega node id');
                }

                $rawUrl = $this->fetchMegaDownloadLinkViaNodeBridge($nodeId);
                if($rawUrl == '')
                {
                    return $this->errorUnknown('Unable to resolve Mega playback link');
                }
            }
            elseif(stripos($rawUrl, 'hetzner://') === 0)
            {
                $remotePath = trim((string)substr($rawUrl, strlen('hetzner://')));
                if($remotePath == '')
                {
                    return $this->errorNotFound('Invalid Hetzner path');
                }

                $rawUrl = $this->buildHetznerFileUrl($remotePath);
                if($rawUrl == '')
                {
                    return $this->errorUnknown('Unable to resolve Hetzner playback link');
                }
            }
            elseif(stripos($rawUrl, 'http://') !== 0 && stripos($rawUrl, 'https://') !== 0)
            {
                $localPath = public_path('video/' . ltrim($rawUrl, '/'));
                if(!File::exists($localPath))
                {
                    return $this->errorNotFound('Video file is missing');
                }

                return response()->file($localPath);
            }

            $remoteUrl = trim((string)$rawUrl);
            $requestHeaders = [
                'User-Agent: Mozilla/5.0',
                'Accept: */*',
            ];
            $rangeHeader = trim((string)$request->header('Range', ''));
            if($rangeHeader != '')
            {
                $requestHeaders[] = 'Range: ' . $rangeHeader;
            }

            if(stripos($remoteUrl, rtrim(trim((string)env('HETZNER_STORAGE_BASE_URL', '')), '/')) === 0)
            {
                $username = trim((string)env('HETZNER_STORAGE_USERNAME', ''));
                $password = trim((string)env('HETZNER_STORAGE_PASSWORD', ''));
                if($username != '' && $password != '')
                {
                    $requestHeaders[] = 'Authorization: Basic ' . base64_encode($username . ':' . $password);
                }
            }

            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'header' => implode("\r\n", $requestHeaders),
                    'follow_location' => 1,
                    'ignore_errors' => true,
                    'timeout' => 45,
                ],
            ]);

            $source = @fopen($remoteUrl, 'rb', false, $context);
            if($source === false)
            {
                return $this->errorUnknown('Unable to stream provider video source');
            }

            $meta = stream_get_meta_data($source);
            $headers = isset($meta['wrapper_data']) && is_array($meta['wrapper_data']) ? $meta['wrapper_data'] : [];
            $statusCode = 200;
            $responseHeaders = [
                'Content-Type' => 'video/mp4',
                'Accept-Ranges' => 'bytes',
                'Access-Control-Allow-Origin' => '*',
                'Cache-Control' => 'no-store, no-cache, must-revalidate',
            ];

            foreach($headers as $headerLine)
            {
                $line = trim((string)$headerLine);
                if($line == '')
                {
                    continue;
                }

                if(stripos($line, 'HTTP/') === 0)
                {
                    if(preg_match('/\s(\d{3})\s/', $line, $matches))
                    {
                        $statusCode = (int)$matches[1];
                    }
                    continue;
                }

                $parts = explode(':', $line, 2);
                if(count($parts) != 2)
                {
                    continue;
                }

                $name = strtolower(trim((string)$parts[0]));
                $value = trim((string)$parts[1]);
                if($value == '')
                {
                    continue;
                }

                if($name == 'content-type')
                {
                    $responseHeaders['Content-Type'] = $value;
                    continue;
                }
                if($name == 'content-length')
                {
                    $responseHeaders['Content-Length'] = $value;
                    continue;
                }
                if($name == 'content-range')
                {
                    $responseHeaders['Content-Range'] = $value;
                    continue;
                }
                if($name == 'accept-ranges')
                {
                    $responseHeaders['Accept-Ranges'] = $value;
                }
            }

            if($statusCode < 200 || $statusCode >= 400)
            {
                fclose($source);
                return $this->errorUnknown('Provider returned non-success response for streaming');
            }

            return response()->stream(function() use($source) {
                while(!feof($source))
                {
                    echo fread($source, 8192);
                    if(function_exists('ob_get_level') && ob_get_level() > 0)
                    {
                        @ob_flush();
                    }
                    flush();
                }
                fclose($source);
            }, $statusCode, $responseHeaders);
        }

        private function resolveMigrationProviderConnectionState($user, $provider)
        {
            $provider = strtolower(trim((string)$provider));

            if($provider == 'dropbox')
            {
                $credentials = $this->resolveDropboxCredentials($user);
                $missingFields = [];

                if($credentials['client_id'] == '')
                {
                    $missingFields[] = 'dropbox_key_or_DROPBOX_CLIENT_ID';
                }
                if($credentials['client_secret'] == '')
                {
                    $missingFields[] = 'dropbox_secret_or_DROPBOX_CLIENT_SECRET';
                }
                if($credentials['access_token'] == '')
                {
                    $missingFields[] = 'dropbox_access_token';
                }

                if(!empty($missingFields))
                {
                    return [
                        'connected' => false,
                        'missing_fields' => $missingFields,
                        'message' => 'Provider is not configured for this integration. Missing: ' . implode(', ', $missingFields),
                    ];
                }

                return [
                    'connected' => true,
                    'missing_fields' => [],
                    'message' => 'Provider credentials found. Connection ready.',
                ];
            }

            $providerRules = [
                'gdrive' => [
                    'scope' => 'user',
                    'required' => ['google_client_id', 'google_client_secret', 'google_api_key'],
                ],
                'dropbox' => [
                    'scope' => 'user',
                    'required' => ['dropbox_key', 'dropbox_secret', 'dropbox_access_token'],
                ],
                'terabox' => [
                    'scope' => 'env',
                    'required' => ['TERABOX_NDUS', 'TERABOX_JS_TOKEN'],
                ],
                'hetzner' => [
                    'scope' => 'env',
                    'required' => ['HETZNER_STORAGE_BASE_URL', 'HETZNER_STORAGE_USERNAME', 'HETZNER_STORAGE_PASSWORD'],
                ],
                'idrive' => [
                    'scope' => 'env',
                    'required' => ['IDRIVE_CLIENT_ID', 'IDRIVE_CLIENT_SECRET', 'IDRIVE_ACCESS_TOKEN'],
                ],
                'drime' => [
                    'scope' => 'env',
                    'required' => ['DRIME_CLIENT_ID', 'DRIME_CLIENT_SECRET', 'DRIME_ACCESS_TOKEN'],
                ],
                'mega' => [
                    'scope' => 'env',
                    'required' => ['MEGA_EMAIL', 'MEGA_PASSWORD'],
                ],
            ];

            if(!isset($providerRules[$provider]))
            {
                return [
                    'connected' => false,
                    'missing_fields' => [],
                    'message' => 'Unsupported provider integration',
                ];
            }

            $rule = $providerRules[$provider];
            $missingFields = [];

            if($rule['scope'] == 'user')
            {
                foreach($rule['required'] as $field)
                {
                    if(trim((string)$user->{$field}) == '')
                    {
                        $missingFields[] = $field;
                    }
                }
            }
            else
            {
                foreach($rule['required'] as $field)
                {
                    if(trim((string)env($field, '')) == '')
                    {
                        $missingFields[] = $field;
                    }
                }

                $allowSandboxFallback = false;
                if(!empty($missingFields) && $allowSandboxFallback)
                {
                    return [
                        'connected' => true,
                        'missing_fields' => $missingFields,
                        'message' => 'Provider connected in sandbox mode. Configure env credentials for live provider access.',
                    ];
                }
            }

            if(!empty($missingFields))
            {
                return [
                    'connected' => false,
                    'missing_fields' => $missingFields,
                    'message' => 'Provider is not configured for this integration. Missing: ' . implode(', ', $missingFields),
                ];
            }

            return [
                'connected' => true,
                'missing_fields' => [],
                'message' => 'Provider credentials found. Connection ready.',
            ];
        }

        private function buildProviderOAuthUrl($provider, $user, $state = '')
        {
            $provider = strtolower(trim((string)$provider));

            if($provider == 'gdrive')
            {
                $clientId = trim((string)($user->google_client_id ?? ''));
                $redirectUri = trim((string)env('GOOGLE_REDIRECT_URI', ''));
                if($clientId == '' || $redirectUri == '')
                {
                    return '';
                }

                return 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
                    'client_id' => $clientId,
                    'redirect_uri' => $redirectUri,
                    'response_type' => 'code',
                    'scope' => 'https://www.googleapis.com/auth/drive.readonly',
                    'access_type' => 'offline',
                    'prompt' => 'consent',
                    'state' => trim((string)$state),
                ]);
            }

            if($provider == 'dropbox')
            {
                $clientId = trim((string)($user->dropbox_key ?? env('DROPBOX_CLIENT_ID', '')));
                $redirectUri = trim((string)env('DROPBOX_REDIRECT_URI', ''));
                if($clientId == '' || $redirectUri == '')
                {
                    return '';
                }

                return 'https://www.dropbox.com/oauth2/authorize?' . http_build_query([
                    'client_id' => $clientId,
                    'redirect_uri' => $redirectUri,
                    'response_type' => 'code',
                    'token_access_type' => 'offline',
                    'state' => trim((string)$state),
                ]);
            }

            $envMap = [
                'terabox' => 'TERABOX_OAUTH_AUTHORIZE_URL',
                'hetzner' => 'HETZNER_OAUTH_AUTHORIZE_URL',
                'idrive' => 'IDRIVE_OAUTH_AUTHORIZE_URL',
                'drime' => 'DRIME_OAUTH_AUTHORIZE_URL',
            ];

            $fallbackMap = [
                'terabox' => 'https://www.terabox.com/wap/login',
                'hetzner' => 'https://accounts.hetzner.com/login',
                'idrive' => 'https://www.idrive.com/idrive/login',
                'drime' => 'https://drime.cloud/',
            ];

            if(!isset($envMap[$provider]))
            {
                return '';
            }

            if($provider == 'hetzner')
            {
                $oauthUrl = $this->buildHetznerOAuthUrl();
                if($oauthUrl != '')
                {
                    return $oauthUrl;
                }
            }

            $configured = trim((string)env($envMap[$provider], ''));
            if($configured != '')
            {
                return $configured;
            }

            return isset($fallbackMap[$provider]) ? $fallbackMap[$provider] : '';
        }

        private function providerOAuthStateCacheKey($state)
        {
            return 'oauth:provider:state:' . trim((string)$state);
        }

        private function generateProviderOAuthState($userId, $provider, $token = '', $clientId = '')
        {
            $provider = strtolower(trim((string)$provider));
            $normalizedUserId = trim((string)$userId);
            $normalizedToken = trim((string)$token);
            $normalizedClientId = trim((string)$clientId);

            $state = '';
            try {
                $state = bin2hex(random_bytes(24));
            }
            catch (\Throwable $e)
            {
                $state = md5($this->helper->addUuid() . microtime(true) . $normalizedUserId . $provider);
            }

            $cachePayload = [
                'user_id' => $normalizedUserId,
                'provider' => $provider,
                'token' => $normalizedToken,
                'client_id' => $normalizedClientId,
                'created_at' => date('c'),
            ];

            Cache::put(
                $this->providerOAuthStateCacheKey($state),
                $cachePayload,
                now()->addSeconds(OAUTH_PROVIDER_STATE_CACHE_TTL_SECONDS)
            );

            return $state;
        }

        private function consumeProviderOAuthState($state, $provider)
        {
            $resolvedState = trim((string)$state);
            $resolvedProvider = strtolower(trim((string)$provider));
            if($resolvedState == '' || $resolvedProvider == '')
            {
                return null;
            }

            $key = $this->providerOAuthStateCacheKey($resolvedState);
            $payload = Cache::get($key);
            Cache::forget($key);

            if(!is_array($payload))
            {
                return null;
            }

            if(strtolower(trim((string)($payload['provider'] ?? ''))) !== $resolvedProvider)
            {
                return null;
            }

            return $payload;
        }

        private function redirectOAuthPopupResult($success, $message, array $payload = [])
        {
            $safeSuccess = $success ? 'true' : 'false';
            $safeMessage = json_encode(trim((string)$message));
            $safePayload = json_encode($payload);
            $html = '<!doctype html><html><head><meta charset="utf-8"><title>OAuth Result</title></head><body>'
                . '<script>(function(){'
                . 'var msg={type:"provider-oauth-result",success:' . $safeSuccess . ',message:' . $safeMessage . ',payload:' . $safePayload . '};'
                . 'try{if(window.opener&&window.opener!==window){window.opener.postMessage(msg,"*");}}catch(e){}'
                . 'window.close();'
                . '})();</script>'
                . '</body></html>';

            return response($html, 200, ['Content-Type' => 'text/html; charset=UTF-8']);
        }

        private function fetchExternalProviderFiles($provider, $providerLabel)
        {
            $provider = strtolower(trim((string)$provider));

            if($provider == 'mega')
            {
                $bridgeFiles = $this->fetchMegaFilesViaNodeBridge();
                if(!empty($bridgeFiles))
                {
                    return $bridgeFiles;
                }

                return [];
            }

            $endpointMap = [
                'terabox' => ['endpoint' => env('TERABOX_FILES_ENDPOINT', ''), 'token' => env('TERABOX_ACCESS_TOKEN', '')],
                'hetzner' => ['endpoint' => env('HETZNER_FILES_ENDPOINT', ''), 'token' => env('HETZNER_ACCESS_TOKEN', '')],
                'idrive' => ['endpoint' => env('IDRIVE_FILES_ENDPOINT', ''), 'token' => env('IDRIVE_ACCESS_TOKEN', '')],
                'drime' => ['endpoint' => env('DRIME_FILES_ENDPOINT', ''), 'token' => env('DRIME_ACCESS_TOKEN', '')],
            ];

            if($provider == 'terabox')
            {
                $bridgeFiles = $this->fetchTeraboxFilesViaNodeBridge();
                if(!empty($bridgeFiles))
                {
                    return $bridgeFiles;
                }
            }

            if(!isset($endpointMap[$provider]))
            {
                return [];
            }

            $endpoint = trim((string)$endpointMap[$provider]['endpoint']);
            if($endpoint == '')
            {
                return [];
            }

            try {
                $token = trim((string)$endpointMap[$provider]['token']);
                $request = Http::timeout(12)->acceptJson();
                if($token != '')
                {
                    $request = $request->withToken($token);
                }

                $response = $request->get($endpoint, ['provider' => $provider]);
                if(!$response->ok())
                {
                    return [];
                }

                $payload = $response->json();
                if(!is_array($payload))
                {
                    return [];
                }

                $items = [];
                if(isset($payload['files']) && is_array($payload['files']))
                {
                    $items = $payload['files'];
                }
                elseif(isset($payload['data']['files']) && is_array($payload['data']['files']))
                {
                    $items = $payload['data']['files'];
                }
                elseif(isset($payload['items']) && is_array($payload['items']))
                {
                    $items = $payload['items'];
                }
                elseif(isset($payload['data']) && is_array($payload['data']))
                {
                    $items = $payload['data'];
                }

                $mapped = [];
                foreach($items as $index => $item)
                {
                    if(!is_array($item))
                    {
                        continue;
                    }

                    $id = trim((string)($item['id'] ?? $item['file_id'] ?? $item['uuid'] ?? ($provider . '_remote_' . $index)));
                    $name = trim((string)($item['name'] ?? $item['filename'] ?? $item['title'] ?? 'video_' . $index . '.mp4'));
                    $title = trim((string)($item['title'] ?? pathinfo($name, PATHINFO_FILENAME) ?? 'Untitled'));
                    $mime = trim((string)($item['mimeType'] ?? $item['mime_type'] ?? 'video/mp4'));
                    $sizeMb = (float)($item['size'] ?? $item['size_mb'] ?? 0);
                    if($sizeMb <= 0 && isset($item['size_bytes']))
                    {
                        $sizeMb = round(((float)$item['size_bytes']) / (1024 * 1024), 2);
                    }

                    $mapped[] = [
                        'id' => $id,
                        'providerId' => $provider,
                        'name' => $name,
                        'title' => $title,
                        'description' => trim((string)($item['description'] ?? ('Fetched from ' . $providerLabel))),
                        'thumbnail' => trim((string)($item['thumbnail'] ?? $item['thumbnailUrl'] ?? '')),
                        'size' => $sizeMb,
                        'mimeType' => $mime,
                        'playbackUrl' => trim((string)($item['playbackUrl'] ?? $item['streamUrl'] ?? $item['url'] ?? '')),
                    ];
                }

                return $mapped;
            }
            catch (\Throwable $e)
            {
                return [];
            }
        }

        private function fetchTeraboxFilesViaNodeBridge()
        {
            $ndus = trim((string)env('TERABOX_NDUS', ''));
            $jsToken = trim((string)env('TERABOX_JS_TOKEN', ''));
            if($ndus == '' || $jsToken == '')
            {
                return [];
            }

            $appId = trim((string)env('TERABOX_APP_ID', '250528'));
            $bdstoken = trim((string)env('TERABOX_BDSTOKEN', ''));
            $browserId = trim((string)env('TERABOX_BROWSER_ID', ''));
            $remoteDir = trim((string)env('TERABOX_REMOTE_DIR', '/'));

            $scriptPath = base_path('scripts/teraboxBridge.cjs');
            if(!File::exists($scriptPath))
            {
                return [];
            }

            try {
                $args = [
                    'node',
                    $scriptPath,
                    '--ndus', $ndus,
                    '--jsToken', $jsToken,
                    '--appId', $appId,
                    '--remoteDir', ($remoteDir == '' ? '/' : $remoteDir),
                ];

                if($bdstoken != '')
                {
                    $args[] = '--bdstoken';
                    $args[] = $bdstoken;
                }
                if($browserId != '')
                {
                    $args[] = '--browserId';
                    $args[] = $browserId;
                }

                $process = new Process($args, base_path());
                $process->setTimeout(25);
                $process->run();

                if(!$process->isSuccessful())
                {
                    return [];
                }

                $output = trim((string)$process->getOutput());
                if($output == '')
                {
                    return [];
                }

                $payload = json_decode($output, true);
                if(!is_array($payload) || !isset($payload['files']) || !is_array($payload['files']))
                {
                    return [];
                }

                return $payload['files'];
            }
            catch (\Throwable $e)
            {
                return [];
            }
        }

        private function fetchMegaFilesViaNodeBridge()
        {
            $email = trim((string)env('MEGA_EMAIL', ''));
            $password = trim((string)env('MEGA_PASSWORD', ''));
            if($email == '' || $password == '')
            {
                return [];
            }

            $rootPath = trim((string)env('MEGA_ROOT_PATH', '/'));
            if($rootPath == '')
            {
                $rootPath = '/';
            }

            $maxFiles = (int)env('MEGA_MAX_FILES', 80);
            if($maxFiles <= 0)
            {
                $maxFiles = 80;
            }
            if($maxFiles > 500)
            {
                $maxFiles = 500;
            }

            $secondFactorCode = trim((string)env('MEGA_SECOND_FACTOR_CODE', ''));
            $recursiveRaw = strtolower(trim((string)env('MEGA_RECURSIVE', 'false')));
            $recursive = in_array($recursiveRaw, ['1', 'true', 'yes', 'on'], true);

            $scriptPath = base_path('scripts/megaBridge.cjs');
            if(!File::exists($scriptPath))
            {
                return [];
            }

            try {
                $args = [
                    'node',
                    $scriptPath,
                    '--mode', 'list',
                    '--email', $email,
                    '--password', $password,
                    '--rootPath', $rootPath,
                    '--maxFiles', (string)$maxFiles,
                    '--includeLinks', 'true',
                ];

                if($secondFactorCode != '')
                {
                    $args[] = '--secondFactorCode';
                    $args[] = $secondFactorCode;
                }

                if($recursive)
                {
                    $args[] = '--recursive';
                    $args[] = 'true';
                }

                $process = new Process($args, base_path());
                $process->setTimeout(60);
                $process->run();

                if(!$process->isSuccessful())
                {
                    return [];
                }

                $output = trim((string)$process->getOutput());
                if($output == '')
                {
                    return [];
                }

                $payload = json_decode($output, true);
                if(!is_array($payload) || !isset($payload['files']) || !is_array($payload['files']))
                {
                    return [];
                }

                $mapped = [];
                foreach($payload['files'] as $index => $item)
                {
                    if(!is_array($item))
                    {
                        continue;
                    }

                    $id = trim((string)($item['id'] ?? $item['nodeId'] ?? ('mega_' . $index)));
                    $name = trim((string)($item['name'] ?? ('mega_video_' . $index . '.mp4')));
                    $title = trim((string)($item['title'] ?? pathinfo($name, PATHINFO_FILENAME) ?? 'Untitled'));
                    $mime = trim((string)($item['mimeType'] ?? 'video/mp4'));
                    $sizeMb = (float)($item['size'] ?? 0);
                    if($sizeMb <= 0 && isset($item['sizeBytes']))
                    {
                        $sizeMb = round(((float)$item['sizeBytes']) / (1024 * 1024), 2);
                    }

                    $mapped[] = [
                        'id' => $id,
                        'providerId' => 'mega',
                        'name' => $name,
                        'title' => $title,
                        'description' => trim((string)($item['description'] ?? 'Fetched from Mega')),
                        'thumbnail' => trim((string)($item['thumbnail'] ?? '')),
                        'size' => $sizeMb,
                        'mimeType' => $mime,
                        'playbackUrl' => trim((string)($item['playbackUrl'] ?? $item['url'] ?? '')),
                    ];
                }

                return $mapped;
            }
            catch (\Throwable $e)
            {
                return [];
            }
        }

        private function buildFallbackProviderFiles($provider, $providerLabel)
        {
            return [
                [
                    'id' => $provider . '_launch_intro',
                    'providerId' => $provider,
                    'name' => strtolower(str_replace(' ', '_', $providerLabel)) . '_launch_intro.mp4',
                    'title' => $providerLabel . ' Launch Intro',
                    'description' => 'Sample migrated file from ' . $providerLabel,
                    'thumbnail' => '',
                    'size' => 128.4,
                    'mimeType' => 'video/mp4',
                    'playbackUrl' => '',
                ],
                [
                    'id' => $provider . '_weekly_update',
                    'providerId' => $provider,
                    'name' => strtolower(str_replace(' ', '_', $providerLabel)) . '_weekly_update.mov',
                    'title' => $providerLabel . ' Weekly Update',
                    'description' => 'Weekly update content fetched from provider storage',
                    'thumbnail' => '',
                    'size' => 256.9,
                    'mimeType' => 'video/quicktime',
                    'playbackUrl' => '',
                ],
            ];
        }
        
        public function dropboxFileUploadGet()
        {
            return view('users.dropBoxLogin');
        }
        
        public function youtubeFileUploadGet()
        {
            return view('users.youTubeLogin');
        }
}
