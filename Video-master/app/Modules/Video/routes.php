<?php
Route::group(['middleware' => ['web', 'general-access'], 'prefix' => 'api/v1', 'namespace' => 'App\Modules\Video\Controllers'], function(){
    Route::resource('video', 'VideoApiController',['only' => [
        'create', 'store', 'update', 'destroy'
    ]]);

    Route::get('oauth/{provider}', 'VideoApiController@oauthProviderConnect');
    Route::post('oauth/{provider}/app', 'VideoApiController@saveOAuthApp');
    Route::get('storage/files', 'VideoApiController@storageFiles');
    Route::post('storage/upload/init', 'VideoApiController@storageUploadInit');
    Route::post('storage/upload/chunk', 'VideoApiController@storageUploadChunk');
    Route::post('storage/upload/finalize', 'VideoApiController@storageUploadFinalize');
    Route::post('storage/upload', 'VideoApiController@storageUpload');
    Route::post('videos/migrate-batch', 'VideoApiController@migrateBatch');
    Route::post('migration/validate', 'VideoApiController@migrationValidate');
    Route::post('migration/start', 'VideoApiController@migrationStart');
    Route::get('migration/status/{jobId}', 'VideoApiController@migrationStatus');
    Route::get('video/migration/stream/{id}', 'VideoApiController@migrationStream');
    
    Route::get('video/history', 'VideoApiController@history');
    Route::get('video/me', 'VideoApiController@my');
    Route::get('video/mine/{id}', 'VideoApiController@showMe');
    
    Route::get('video/{id}/like', 'LikeApiController@like');
    Route::get('video/{id}/dislike', 'LikeApiController@dislike');
    
    Route::post('video/{id}/current', 'VideoApiController@currentVideoPosition');
    
    Route::post('/video/link', 'VideoApiController@pasteLink');
    Route::post('/video/google/drive/upload',array('as'=>'glogin','uses'=>'VideoApiController@googleLogin'));
    Route::post('/video/dropbox/upload', 'VideoApiController@dropboxFileUpload');
    Route::post('/video/dropbox/ingest', 'VideoApiController@dropboxLinkIngestUpload');
    Route::post('/video/youtube/upload', 'VideoApiController@youtubeFileUpload');
});

Route::group(['middleware' => ['web'], 'prefix' => 'api/v1', 'namespace' => 'App\Modules\Video\Controllers'], function(){
    Route::get('/video/google/drive/upload',array('as'=>'glogin','uses'=>'VideoApiController@googleLogin'));
    Route::get('/video/google/user/list', array('as'=>'user.glist','uses' => 'VideoApiController@listGoogleUser'));
    
    Route::get('/video/google/drive/upload/get',array('uses'=>'VideoApiController@googleLoginGet'));
    Route::get('/video/dropbox/upload/get', 'VideoApiController@dropboxFileUploadGet');
    Route::get('/video/youtube/upload/get', 'VideoApiController@youtubeFileUploadGet');
    Route::get('/video/youtube/upload', 'VideoApiController@youtubeFileUpload');
    
});

Route::group(['middleware' => ['web','general-temp-access'], 'prefix' => 'api/v1/video', 'namespace' => 'App\Modules\Video\Controllers'], function(){
    Route::resource('/', 'VideoApiController',['only' => [
        'show'
    ]]);
    
    
});

Route::group(['middleware' => ['web', 'general-access'], 'prefix' => 'api/v1/video/{id}', 'namespace' => 'App\Modules\Video\Controllers'], function(){
    Route::resource('comment', 'CommentApiController',['only' => [
        'create', 'store', 'update', 'destroy'
    ]]);
    Route::get('start', 'VideoApiController@startVideo');
    
});

Route::group(['middleware' => ['web', 'general-access'], 'prefix' => 'api/v1/video/{id}/comment/{commentID}', 'namespace' => 'App\Modules\Video\Controllers'], function(){
    Route::resource('reply', 'ReplyCommentApiController',['only' => [
        'store', 'update', 'destroy'
    ]]);
    
});

Route::group(['middleware' => ['web'], 'prefix' => 'api/v1', 'namespace' => 'App\Modules\Video\Controllers'], function(){
    Route::resource('video', 'VideoApiController',['except' => [
        'create', 'store', 'update', 'destroy', 'show'
    ]]);
    Route::get('videos/{id}/stream-url', 'VideoApiController@videoStreamUrl');
    Route::get('privacy/options', 'VideoApiController@privacyOptions');
    Route::get('video/search/{name}/{no_of_results}', 'VideoApiController@searchVideos');
});

Route::group(['middleware' => ['web'], 'prefix' => 'api/v1/video/{id}', 'namespace' => 'App\Modules\Video\Controllers'], function(){
    Route::resource('comment', 'CommentApiController',['except' => [
        'store', 'update', 'destroy', 'show'
    ]]);
});


Route::group(['middleware' => ['web'], 'prefix' => 'api/v1/video/{id}/comment/{commentID}', 'namespace' => 'App\Modules\Video\Controllers'], function(){
    Route::resource('reply', 'ReplyCommentApiController',['except' => [
        'store', 'update', 'destroy'
    ]]);
    
});

Route::group(['middleware' => ['web'], 'prefix' => 'api/v1', 'namespace' => 'App\Modules\Admin\Controllers'], function(){
    Route::resource('tag', 'AdminTagApiController',['only' => [
        'index', 'show'
    ]]);
});
