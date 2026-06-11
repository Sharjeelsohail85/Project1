<?php

use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Include module routes
require base_path('app/Modules/Video/routes.php');
require base_path('app/Modules/User/routes.php');
require base_path('app/Modules/Admin/routes.php');

Route::get('api/v1/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'project1-backend',
    ]);
});

//Route::middleware('auth:api')->get('/user', function (Request $request) {
//    return $request->user();
//});
