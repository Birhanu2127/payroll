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
        Schema::create('salary_template_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('salary_template_id')
                ->constrained('salary_templates')
                ->cascadeOnDelete();
            $table->string('type');
            $table->string('name');
            $table->decimal('amount', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_template_items');
    }
};
