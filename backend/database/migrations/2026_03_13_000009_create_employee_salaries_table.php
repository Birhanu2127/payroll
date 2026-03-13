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
        Schema::create('employee_salaries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('employee_id')
                ->constrained('employees')
                ->cascadeOnDelete();
            $table->foreignId('salary_grade_id')
                ->nullable()
                ->constrained('salary_grades')
                ->nullOnDelete();
            $table->foreignId('salary_template_id')
                ->nullable()
                ->constrained('salary_templates')
                ->nullOnDelete();
            $table->decimal('basic_salary', 12, 2)->default(0);
            $table->decimal('allowances_total', 12, 2)->default(0);
            $table->decimal('deductions_total', 12, 2)->default(0);
            $table->decimal('net_salary', 12, 2)->default(0);
            $table->string('payment_frequency')->default('Monthly');
            $table->date('effective_date');
            $table->string('status')->default('Active');
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
        Schema::dropIfExists('employee_salaries');
    }
};
