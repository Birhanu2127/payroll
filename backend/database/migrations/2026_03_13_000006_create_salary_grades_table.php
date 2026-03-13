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
        Schema::create('salary_grades', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('level')->nullable();
            $table->decimal('min_salary', 12, 2);
            $table->decimal('max_salary', 12, 2);
            $table->text('description')->nullable();
            $table->string('status')->default('Active');
            $table->date('created_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_grades');
    }
};
