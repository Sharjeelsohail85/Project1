<?php

namespace App\Jobs;

use App\Modules\Video\Controllers\VideoApiController;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;

class MigrateVideoJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $jobId;

    /**
     * Create a new job instance.
     */
    public function __construct($jobId)
    {
        $this->jobId = trim((string)$jobId);
    }

    /**
     * Execute the job.
     */
    public function handle()
    {
        if($this->jobId == '')
        {
            return;
        }

        /** @var VideoApiController $controller */
        $controller = app(VideoApiController::class);
        $controller->processMigrationJobFromQueue($this->jobId);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception)
    {
        if($this->jobId == '')
        {
            return;
        }

        $key = 'migration:job:' . $this->jobId;
        $state = Cache::get($key);
        if(!is_array($state))
        {
            return;
        }

        $state['completed'] = false;
        $state['stage'] = 'failed';
        $state['error'] = trim((string)$exception->getMessage()) != ''
            ? trim((string)$exception->getMessage())
            : 'Migration failed.';

        Cache::put($key, $state, now()->addSeconds(3600));
    }
}

