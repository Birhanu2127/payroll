<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class SystemSettingController extends Controller
{
    public function show(): JsonResponse
    {
        $settings = $this->resolveSettings();

        return response()->json([
            'data' => $this->serialize($settings),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $settings = $this->resolveSettings();
        $validated = $this->validatePayload($request);
        $payload = $this->mapPayload($validated);

        if (! empty($payload)) {
            $settings->fill($payload);
            $settings->save();
        }

        return response()->json([
            'data' => $this->serialize($settings->fresh()),
        ]);
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $settings = $this->resolveSettings();

        $validated = $request->validate([
            'logo' => ['required', 'image', 'max:2048'],
        ]);

        $path = $validated['logo']->store('company-logos', 'public');
        $settings->company_logo_path = $path;
        $settings->save();

        return response()->json([
            'data' => [
                'companyLogoUrl' => $this->logoUrl($settings),
            ],
        ]);
    }

    private function resolveSettings(): SystemSetting
    {
        $settings = SystemSetting::query()->first();

        if (! $settings) {
            $settings = SystemSetting::create($this->defaultSettings());
        }

        return $settings;
    }

    /**
     * @return array<string, mixed>
     */
    private function defaultSettings(): array
    {
        return [
            'default_salary_type' => 'Monthly',
            'payroll_processing_day' => 25,
            'overtime_calculation_method' => 'Standard',
            'tax_calculation_method' => 'Progressive',
            'allow_negative_leave_balance' => false,
            'salary_rounding_rules' => 'Nearest 0.01',
            'automatic_payroll_generation' => false,
            'payslip_format' => 'Standard',
            'working_days' => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            'weekend_days' => ['Sat', 'Sun'],
            'daily_working_hours' => 8,
            'shift_start_time' => '09:00',
            'shift_end_time' => '17:00',
            'break_time_minutes' => 60,
            'overtime_start_after_hours' => 8,
            'default_currency' => 'US Dollar',
            'currency_symbol' => '$',
            'currency_code' => 'USD',
            'decimal_format' => '1,234.56',
            'currency_position' => 'Before',
            'mail_driver' => 'smtp',
            'smtp_port' => 587,
            'encryption_type' => 'tls',
            'enable_email_notifications' => true,
            'enable_system_notifications' => true,
            'leave_request_alerts' => true,
            'payroll_generation_alerts' => true,
            'overtime_request_alerts' => true,
            'attendance_alerts' => true,
            'backup_auto_enabled' => false,
            'backup_frequency' => 'Weekly',
            'backup_type' => 'Database',
            'backup_storage_driver' => 'Local',
            'backup_retention_days' => 30,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request): array
    {
        $dayRule = Rule::in(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

        return $request->validate([
            'companyName' => ['sometimes', 'nullable', 'string', 'max:255'],
            'companyEmail' => ['sometimes', 'nullable', 'email', 'max:255'],
            'companyPhone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'companyAddress' => ['sometimes', 'nullable', 'string', 'max:255'],
            'country' => ['sometimes', 'nullable', 'string', 'max:100'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'postalCode' => ['sometimes', 'nullable', 'string', 'max:20'],
            'taxIdentificationNumber' => ['sometimes', 'nullable', 'string', 'max:100'],
            'companyRegistrationNumber' => ['sometimes', 'nullable', 'string', 'max:100'],
            'website' => ['sometimes', 'nullable', 'string', 'max:255'],

            'defaultSalaryType' => ['sometimes', 'nullable', 'string', 'max:50'],
            'payrollProcessingDay' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:31'],
            'overtimeCalculationMethod' => ['sometimes', 'nullable', 'string', 'max:100'],
            'taxCalculationMethod' => ['sometimes', 'nullable', 'string', 'max:100'],
            'allowNegativeLeaveBalance' => ['sometimes', 'boolean'],
            'salaryRoundingRules' => ['sometimes', 'nullable', 'string', 'max:100'],
            'automaticPayrollGeneration' => ['sometimes', 'boolean'],
            'payslipFormat' => ['sometimes', 'nullable', 'string', 'max:100'],

            'workingDays' => ['sometimes', 'array'],
            'workingDays.*' => ['string', $dayRule],
            'weekendDays' => ['sometimes', 'array'],
            'weekendDays.*' => ['string', $dayRule],
            'dailyWorkingHours' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:24'],
            'shiftStartTime' => ['sometimes', 'nullable', 'date_format:H:i'],
            'shiftEndTime' => ['sometimes', 'nullable', 'date_format:H:i'],
            'breakTimeMinutes' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:360'],
            'overtimeStartAfterHours' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:24'],

            'defaultCurrency' => ['sometimes', 'nullable', 'string', 'max:100'],
            'currencySymbol' => ['sometimes', 'nullable', 'string', 'max:15'],
            'currencyCode' => ['sometimes', 'nullable', 'string', 'max:15'],
            'decimalFormat' => ['sometimes', 'nullable', 'string', 'max:20'],
            'currencyPosition' => ['sometimes', 'nullable', 'string', 'max:20'],
            'exchangeRate' => ['sometimes', 'nullable', 'numeric', 'min:0'],

            'mailDriver' => ['sometimes', 'nullable', 'string', 'max:50'],
            'smtpHost' => ['sometimes', 'nullable', 'string', 'max:255'],
            'smtpPort' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:65535'],
            'smtpUsername' => ['sometimes', 'nullable', 'string', 'max:255'],
            'smtpPassword' => ['sometimes', 'nullable', 'string', 'max:255'],
            'encryptionType' => ['sometimes', 'nullable', 'string', 'max:20'],
            'fromEmailAddress' => ['sometimes', 'nullable', 'email', 'max:255'],
            'fromName' => ['sometimes', 'nullable', 'string', 'max:255'],

            'enableEmailNotifications' => ['sometimes', 'boolean'],
            'enableSystemNotifications' => ['sometimes', 'boolean'],
            'leaveRequestAlerts' => ['sometimes', 'boolean'],
            'payrollGenerationAlerts' => ['sometimes', 'boolean'],
            'overtimeRequestAlerts' => ['sometimes', 'boolean'],
            'attendanceAlerts' => ['sometimes', 'boolean'],

            'backupAutoEnabled' => ['sometimes', 'boolean'],
            'backupFrequency' => ['sometimes', 'nullable', 'string', 'max:50'],
            'backupType' => ['sometimes', 'nullable', 'string', 'max:50'],
            'backupStorageDriver' => ['sometimes', 'nullable', 'string', 'max:50'],
            'backupRetentionDays' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:3650'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function mapPayload(array $validated): array
    {
        $payload = [];

        $this->setIfPresent($payload, $validated, 'companyName', 'company_name');
        $this->setIfPresent($payload, $validated, 'companyEmail', 'company_email');
        $this->setIfPresent($payload, $validated, 'companyPhone', 'company_phone');
        $this->setIfPresent($payload, $validated, 'companyAddress', 'company_address');
        $this->setIfPresent($payload, $validated, 'country', 'country');
        $this->setIfPresent($payload, $validated, 'city', 'city');
        $this->setIfPresent($payload, $validated, 'postalCode', 'postal_code');
        $this->setIfPresent($payload, $validated, 'taxIdentificationNumber', 'tax_identification_number');
        $this->setIfPresent($payload, $validated, 'companyRegistrationNumber', 'company_registration_number');
        $this->setIfPresent($payload, $validated, 'website', 'website');

        $this->setIfPresent($payload, $validated, 'defaultSalaryType', 'default_salary_type');
        $this->setIfPresent($payload, $validated, 'payrollProcessingDay', 'payroll_processing_day');
        $this->setIfPresent($payload, $validated, 'overtimeCalculationMethod', 'overtime_calculation_method');
        $this->setIfPresent($payload, $validated, 'taxCalculationMethod', 'tax_calculation_method');
        $this->setIfPresent($payload, $validated, 'allowNegativeLeaveBalance', 'allow_negative_leave_balance');
        $this->setIfPresent($payload, $validated, 'salaryRoundingRules', 'salary_rounding_rules');
        $this->setIfPresent($payload, $validated, 'automaticPayrollGeneration', 'automatic_payroll_generation');
        $this->setIfPresent($payload, $validated, 'payslipFormat', 'payslip_format');

        $this->setIfPresent($payload, $validated, 'workingDays', 'working_days');
        $this->setIfPresent($payload, $validated, 'weekendDays', 'weekend_days');
        $this->setIfPresent($payload, $validated, 'dailyWorkingHours', 'daily_working_hours');
        $this->setIfPresent($payload, $validated, 'shiftStartTime', 'shift_start_time');
        $this->setIfPresent($payload, $validated, 'shiftEndTime', 'shift_end_time');
        $this->setIfPresent($payload, $validated, 'breakTimeMinutes', 'break_time_minutes');
        $this->setIfPresent($payload, $validated, 'overtimeStartAfterHours', 'overtime_start_after_hours');

        $this->setIfPresent($payload, $validated, 'defaultCurrency', 'default_currency');
        $this->setIfPresent($payload, $validated, 'currencySymbol', 'currency_symbol');
        $this->setIfPresent($payload, $validated, 'currencyCode', 'currency_code');
        $this->setIfPresent($payload, $validated, 'decimalFormat', 'decimal_format');
        $this->setIfPresent($payload, $validated, 'currencyPosition', 'currency_position');
        $this->setIfPresent($payload, $validated, 'exchangeRate', 'exchange_rate');

        $this->setIfPresent($payload, $validated, 'mailDriver', 'mail_driver');
        $this->setIfPresent($payload, $validated, 'smtpHost', 'smtp_host');
        $this->setIfPresent($payload, $validated, 'smtpPort', 'smtp_port');
        $this->setIfPresent($payload, $validated, 'smtpUsername', 'smtp_username');
        $this->setIfPresent($payload, $validated, 'encryptionType', 'encryption_type');
        $this->setIfPresent($payload, $validated, 'fromEmailAddress', 'from_email_address');
        $this->setIfPresent($payload, $validated, 'fromName', 'from_name');

        if (array_key_exists('smtpPassword', $validated) && $validated['smtpPassword'] !== '') {
            $payload['smtp_password'] = $validated['smtpPassword'];
        }

        $this->setIfPresent($payload, $validated, 'enableEmailNotifications', 'enable_email_notifications');
        $this->setIfPresent($payload, $validated, 'enableSystemNotifications', 'enable_system_notifications');
        $this->setIfPresent($payload, $validated, 'leaveRequestAlerts', 'leave_request_alerts');
        $this->setIfPresent($payload, $validated, 'payrollGenerationAlerts', 'payroll_generation_alerts');
        $this->setIfPresent($payload, $validated, 'overtimeRequestAlerts', 'overtime_request_alerts');
        $this->setIfPresent($payload, $validated, 'attendanceAlerts', 'attendance_alerts');

        $this->setIfPresent($payload, $validated, 'backupAutoEnabled', 'backup_auto_enabled');
        $this->setIfPresent($payload, $validated, 'backupFrequency', 'backup_frequency');
        $this->setIfPresent($payload, $validated, 'backupType', 'backup_type');
        $this->setIfPresent($payload, $validated, 'backupStorageDriver', 'backup_storage_driver');
        $this->setIfPresent($payload, $validated, 'backupRetentionDays', 'backup_retention_days');

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(SystemSetting $settings): array
    {
        return [
            'companyName' => $settings->company_name,
            'companyLogoUrl' => $this->logoUrl($settings),
            'companyEmail' => $settings->company_email,
            'companyPhone' => $settings->company_phone,
            'companyAddress' => $settings->company_address,
            'country' => $settings->country,
            'city' => $settings->city,
            'postalCode' => $settings->postal_code,
            'taxIdentificationNumber' => $settings->tax_identification_number,
            'companyRegistrationNumber' => $settings->company_registration_number,
            'website' => $settings->website,

            'defaultSalaryType' => $settings->default_salary_type,
            'payrollProcessingDay' => $settings->payroll_processing_day,
            'overtimeCalculationMethod' => $settings->overtime_calculation_method,
            'taxCalculationMethod' => $settings->tax_calculation_method,
            'allowNegativeLeaveBalance' => $settings->allow_negative_leave_balance,
            'salaryRoundingRules' => $settings->salary_rounding_rules,
            'automaticPayrollGeneration' => $settings->automatic_payroll_generation,
            'payslipFormat' => $settings->payslip_format,

            'workingDays' => $settings->working_days ?? [],
            'weekendDays' => $settings->weekend_days ?? [],
            'dailyWorkingHours' => $settings->daily_working_hours,
            'shiftStartTime' => $this->formatTime($settings->shift_start_time),
            'shiftEndTime' => $this->formatTime($settings->shift_end_time),
            'breakTimeMinutes' => $settings->break_time_minutes,
            'overtimeStartAfterHours' => $settings->overtime_start_after_hours,

            'defaultCurrency' => $settings->default_currency,
            'currencySymbol' => $settings->currency_symbol,
            'currencyCode' => $settings->currency_code,
            'decimalFormat' => $settings->decimal_format,
            'currencyPosition' => $settings->currency_position,
            'exchangeRate' => $settings->exchange_rate,

            'mailDriver' => $settings->mail_driver,
            'smtpHost' => $settings->smtp_host,
            'smtpPort' => $settings->smtp_port,
            'smtpUsername' => $settings->smtp_username,
            'smtpPasswordSet' => ! empty($settings->smtp_password),
            'encryptionType' => $settings->encryption_type,
            'fromEmailAddress' => $settings->from_email_address,
            'fromName' => $settings->from_name,

            'enableEmailNotifications' => $settings->enable_email_notifications,
            'enableSystemNotifications' => $settings->enable_system_notifications,
            'leaveRequestAlerts' => $settings->leave_request_alerts,
            'payrollGenerationAlerts' => $settings->payroll_generation_alerts,
            'overtimeRequestAlerts' => $settings->overtime_request_alerts,
            'attendanceAlerts' => $settings->attendance_alerts,

            'backupAutoEnabled' => $settings->backup_auto_enabled,
            'backupFrequency' => $settings->backup_frequency,
            'backupType' => $settings->backup_type,
            'backupStorageDriver' => $settings->backup_storage_driver,
            'backupRetentionDays' => $settings->backup_retention_days,
        ];
    }

    private function logoUrl(SystemSetting $settings): ?string
    {
        if (! $settings->company_logo_path) {
            return null;
        }

        return url(Storage::disk('public')->url($settings->company_logo_path));
    }

    private function formatTime(mixed $value): ?string
    {
        if (! $value) {
            return null;
        }

        if ($value instanceof \Carbon\CarbonInterface) {
            return $value->format('H:i');
        }

        if (is_string($value)) {
            return substr($value, 0, 5);
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $target
     * @param  array<string, mixed>  $source
     */
    private function setIfPresent(array &$target, array $source, string $sourceKey, string $targetKey): void
    {
        if (array_key_exists($sourceKey, $source)) {
            $target[$targetKey] = $source[$sourceKey];
        }
    }
}
