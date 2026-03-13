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
        Schema::create('system_backups', function (Blueprint $table): void {
            $table->id();
            $table->string('backup_type', 50);
            $table->string('storage_driver', 50)->nullable();
            $table->string('file_name')->nullable();
            $table->decimal('size_mb', 8, 2)->nullable();
            $table->string('status', 50)->default('Completed');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamp('restored_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_backups');
    }
};
