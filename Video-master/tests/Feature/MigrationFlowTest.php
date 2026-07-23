<?php

namespace Tests\Feature;

use Tests\TestCase;
use Carbon\Carbon;
use App\Modules\Helper\Helper;
use App\Modules\Managers\User\UserModel;
use App\Modules\Managers\Channel\ChannelModel;
use App\Modules\Managers\SessionToken\SessionTokenModel;
use App\Modules\Managers\PrivacyOption\PrivacyOptionModel;

class MigrationFlowTest extends TestCase
{
    private function createAuthContext()
    {
        $helper = new Helper();

        $user = UserModel::create([
            'uuid' => $helper->addUuid(),
            'first_name' => 'Migration',
            'last_name' => 'Tester',
            'email' => 'migration_flow_' . uniqid() . '@example.com',
            'password' => bcrypt('secret123'),
            'registration_type' => 'general',
            'active' => 1,
        ]);

        $public = PrivacyOptionModel::where('name', 'Public')->first();
        if(!$public)
        {
            $public = PrivacyOptionModel::create([
                'uuid' => $helper->addUuid(),
                'name' => 'Public',
                'description' => 'Auto-created for migration tests',
            ]);
        }

        $channel = ChannelModel::where('user_id', $user->uuid)->where('name', 'General')->first();
        if(!$channel)
        {
            $channel = ChannelModel::create([
                'uuid' => $helper->addUuid(),
                'name' => 'General',
                'description' => 'General test channel',
                'active' => 1,
                'user_id' => $user->uuid,
                'privacy_option_id' => $public->uuid,
            ]);
        }

        $token = SessionTokenModel::create([
            'uuid' => $helper->addUuid(),
            'user_id' => $user->uuid,
            'client_id' => 'migration_test_client_' . uniqid(),
            'token' => 'migration_test_token_' . uniqid(),
            'expiry_date' => Carbon::now()->addDay()->toDateString(),
        ]);

        return [
            'user' => $user,
            'channel' => $channel,
            'privacy' => $public,
            'token' => $token,
        ];
    }

    public function testMigrationValidateRejectsPlaylistUrl()
    {
        $auth = $this->createAuthContext();

        $response = $this->post('/api/v1/migration/validate', [
            'token' => $auth['token']->token,
            'client_id' => $auth['token']->client_id,
            'sourceUrl' => 'https://cdn.example.com/playlist.m3u8',
            'provider' => 'hetzner',
        ]);

        $response->assertStatus(400);
    }

    public function testMigrationStartAndStatusLifecycleWithInvalidSource()
    {
        $auth = $this->createAuthContext();

        $start = $this->post('/api/v1/migration/start', [
            'token' => $auth['token']->token,
            'client_id' => $auth['token']->client_id,
            'sourceUrl' => 'https://invalid.localhost/not-found-video.mp4',
            'provider' => 'hetzner',
            'metadata' => [
                'title' => 'Flow test video',
                'description' => 'Flow test',
                'visibility' => 'public',
                'tags' => ['migration', 'test'],
            ],
        ]);

        $start->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['jobId'],
            ]);

        $jobId = (string)data_get($start->json(), 'data.jobId', '');
        $this->assertNotSame('', $jobId);

        $status = $this->get('/api/v1/migration/status/' . urlencode($jobId) . '?token=' . urlencode($auth['token']->token) . '&client_id=' . urlencode($auth['token']->client_id));

        $status->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'jobId',
                    'progress',
                    'stage',
                    'completed',
                    'videoId',
                    'error',
                ],
            ]);

        $payload = (array)data_get($status->json(), 'data', []);
        $this->assertSame($jobId, (string)($payload['jobId'] ?? ''));
        $this->assertArrayHasKey('progress', $payload);
        $this->assertArrayHasKey('stage', $payload);
    }

    public function testStreamUrlEndpointRejectsUnknownVideo()
    {
        $auth = $this->createAuthContext();

        $response = $this->get('/api/v1/videos/not-a-real-video-id/stream-url?token=' . urlencode($auth['token']->token) . '&client_id=' . urlencode($auth['token']->client_id));
        $response->assertStatus(404);
    }
}

