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
        Schema::create('system_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('company_name')->nullable();
            $table->string('company_logo_path')->nullable();
            $table->string('company_email')->nullable();
            $table->string('company_phone', 50)->nullable();
            $table->string('company_address')->nullable();
            $table->string('country', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('tax_identification_number', 100)->nullable();
            $table->string('company_registration_number', 100)->nullable();
            $table->string('website')->nullable();

            $table->string('default_salary_type', 50)->nullable();
            $table->unsignedTinyInteger('payroll_processing_day')->nullable();
            $table->string('overtime_calculation_method', 100)->nullable();
            $table->string('tax_calculation_method', 100)->nullable();
            $table->boolean('allow_negative_leave_balance')->default(false);
            $table->string('salary_rounding_rules', 100)->nullable();
            $table->boolean('automatic_payroll_generation')->default(false);
            $table->string('payslip_format', 100)->nullable();

            $table->text('working_days')->nullable();
            $table->text('weekend_days')->nullable();
            $table->decimal('daily_working_hours', 4, 2)->nullable();
            $table->time('shift_start_time')->nullable();
            $table->time('shift_end_time')->nullable();
            $table->unsignedSmallInteger('break_time_minutes')->nullable();
            $table->decimal('overtime_start_after_hours', 4, 2)->nullable();

            $table->string('default_currency', 100)->nullable();
            $table->string('currency_symbol', 15)->nullable();
            $table->string('currency_code', 15)->nullable();
            $table->string('decimal_format', 20)->nullable();
            $table->string('currency_position', 20)->nullable();
            $table->decimal('exchange_rate', 12, 4)->nullable();

            $table->string('mail_driver', 50)->nullable();
            $table->string('smtp_host')->nullable();
            $table->unsignedSmallInteger('smtp_port')->nullable();
            $table->string('smtp_username')->nullable();
            $table->string('smtp_password')->nullable();
            $table->string('encryption_type', 20)->nullable();
            $table->string('from_email_address')->nullable();
            $table->string('from_name')->nullable();

            $table->boolean('enable_email_notifications')->default(true);
            $table->boolean('enable_system_notifications')->default(true);
            $table->boolean('leave_request_alerts')->default(true);
            $table->boolean('payroll_generation_alerts')->default(true);
            $table->boolean('overtime_request_alerts')->default(true);
            $table->boolean('attendance_alerts')->default(true);

            $table->boolean('backup_auto_enabled')->default(false);
            $table->string('backup_frequency', 50)->nullable();
            $table->string('backup_type', 50)->nullable();
            $table->string('backup_storage_driver', 50)->nullable();
            $table->unsignedSmallInteger('backup_retention_days')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
