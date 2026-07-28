<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddGoogleOauthTokensToUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if(!Schema::hasTable('users'))
        {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            if(!Schema::hasColumn('users', 'google_access_token'))
            {
                $table->text('google_access_token')->nullable()->after('google_folder_id');
            }

            if(!Schema::hasColumn('users', 'google_refresh_token'))
            {
                $table->text('google_refresh_token')->nullable()->after('google_access_token');
            }

            if(!Schema::hasColumn('users', 'google_token_expires_at'))
            {
                $table->dateTime('google_token_expires_at')->nullable()->after('google_refresh_token');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if(!Schema::hasTable('users'))
        {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $dropColumns = [];

            if(Schema::hasColumn('users', 'google_token_expires_at'))
            {
                $dropColumns[] = 'google_token_expires_at';
            }

            if(Schema::hasColumn('users', 'google_refresh_token'))
            {
                $dropColumns[] = 'google_refresh_token';
            }

            if(Schema::hasColumn('users', 'google_access_token'))
            {
                $dropColumns[] = 'google_access_token';
            }

            if(!empty($dropColumns))
            {
                $table->dropColumn($dropColumns);
            }
        });
    }
}

