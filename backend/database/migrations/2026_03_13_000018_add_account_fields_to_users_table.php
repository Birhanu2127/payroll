<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('employee_name')->nullable()->after('name');
            $table->string('phone', 50)->nullable()->after('email');
            $table->string('department')->nullable()->after('phone');
            $table->string('status', 20)->default('Active')->after('department');
            $table->timestamp('last_login_at')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['employee_name', 'phone', 'department', 'status', 'last_login_at']);
        });
    }
};
