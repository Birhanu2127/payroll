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
        Schema::create('salary_bulk_updates', function (Blueprint $table): void {
            $table->id();
            $table->string('department')->nullable();
            $table->foreignId('salary_grade_id')
                ->nullable()
                ->constrained('salary_grades')
                ->nullOnDelete();
            $table->string('increase_type');
            $table->decimal('increase_value', 12, 2);
            $table->date('effective_date');
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_bulk_updates');
    }
};
