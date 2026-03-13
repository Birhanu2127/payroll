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
        Schema::create('employees', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('employee_id')->unique();
            $table->string('email')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('department');
            $table->string('position');
            $table->string('employment_type')->default('Full-time');
            $table->date('join_date')->nullable();
            $table->string('status')->default('Active');
            $table->string('attendance')->nullable();
            $table->string('gender', 50)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('address')->nullable();
            $table->string('manager')->nullable();
            $table->string('role')->default('Employee');
            $table->unsignedSmallInteger('avatar_hue')->nullable();
            $table->date('created_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
