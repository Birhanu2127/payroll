<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\EmployeeSalaryController;
use App\Http\Controllers\Api\SalaryBulkUpdateController;
use App\Http\Controllers\Api\SalaryGradeController;
use App\Http\Controllers\Api\SalaryHistoryController;
use App\Http\Controllers\Api\SalaryTemplateController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'message' => 'Laravel API connected successfully.',
        'timestamp' => now()->toIso8601String(),
    ]);
});

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('api.token')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware('api.token')->group(function (): void {
    Route::get('/dashboard', function () {
        return response()->json([
            'overview' => [
                [
                    'label' => 'Active Employees',
                    'value' => 248,
                    'hint' => '+6 this month',
                ],
                [
                    'label' => 'Pending Payroll Runs',
                    'value' => 4,
                    'hint' => '2 due this week',
                ],
                [
                    'label' => 'Approvals Waiting',
                    'value' => 11,
                    'hint' => 'Finance and HR',
                ],
                [
                    'label' => 'Monthly Net Payout',
                    'value' => 412980,
                    'hint' => 'USD',
                ],
            ],
            'payroll_analytics' => [
                'gross_trend' => [
                    ['month' => 'Oct', 'amount' => 468500],
                    ['month' => 'Nov', 'amount' => 472200],
                    ['month' => 'Dec', 'amount' => 481000],
                    ['month' => 'Jan', 'amount' => 489400],
                    ['month' => 'Feb', 'amount' => 497900],
                    ['month' => 'Mar', 'amount' => 505200],
                ],
                'cost_split' => [
                    ['name' => 'Base Salary', 'percentage' => 72],
                    ['name' => 'Allowances', 'percentage' => 14],
                    ['name' => 'Overtime', 'percentage' => 7],
                    ['name' => 'Benefits', 'percentage' => 7],
                ],
            ],
            'monthly_summary' => [
                'period' => now()->format('F Y'),
                'gross_pay' => 505200,
                'allowances' => 70500,
                'deductions' => 42500,
                'taxes' => 49720,
                'net_pay' => 412980,
                'departments' => [
                    ['name' => 'Engineering', 'employees' => 58, 'net' => 116400],
                    ['name' => 'Operations', 'employees' => 44, 'net' => 84300],
                    ['name' => 'Finance', 'employees' => 26, 'net' => 46800],
                    ['name' => 'Human Resources', 'employees' => 19, 'net' => 35250],
                    ['name' => 'Sales', 'employees' => 38, 'net' => 72700],
                ],
            ],
            'system_notifications' => [
                [
                    'title' => 'Payroll approval required',
                    'level' => 'warning',
                    'message' => 'March payroll batch is waiting for final approval.',
                    'time' => now()->subHours(2)->toDateTimeString(),
                ],
                [
                    'title' => 'Tax table update completed',
                    'level' => 'success',
                    'message' => 'Government tax bracket changes have been applied.',
                    'time' => now()->subDay()->toDateTimeString(),
                ],
                [
                    'title' => 'Bank file export failed',
                    'level' => 'error',
                    'message' => 'One payment batch could not be generated due to invalid account format.',
                    'time' => now()->subDays(2)->toDateTimeString(),
                ],
                [
                    'title' => 'New employee onboarding',
                    'level' => 'info',
                    'message' => 'Seven new hires were added and need salary assignment.',
                    'time' => now()->subDays(3)->toDateTimeString(),
                ],
            ],
        ]);
    });

    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::post('/employees', [EmployeeController::class, 'store']);
    Route::put('/employees/{employee}', [EmployeeController::class, 'update']);
    Route::patch('/employees/{employee}', [EmployeeController::class, 'update']);
    Route::delete('/employees/{employee}', [EmployeeController::class, 'destroy']);

    Route::get('/salary-grades', [SalaryGradeController::class, 'index']);
    Route::post('/salary-grades', [SalaryGradeController::class, 'store']);
    Route::put('/salary-grades/{salaryGrade}', [SalaryGradeController::class, 'update']);
    Route::patch('/salary-grades/{salaryGrade}', [SalaryGradeController::class, 'update']);
    Route::delete('/salary-grades/{salaryGrade}', [SalaryGradeController::class, 'destroy']);

    Route::get('/salary-templates', [SalaryTemplateController::class, 'index']);
    Route::post('/salary-templates', [SalaryTemplateController::class, 'store']);
    Route::put('/salary-templates/{salaryTemplate}', [SalaryTemplateController::class, 'update']);
    Route::patch('/salary-templates/{salaryTemplate}', [SalaryTemplateController::class, 'update']);
    Route::delete('/salary-templates/{salaryTemplate}', [SalaryTemplateController::class, 'destroy']);

    Route::get('/employee-salaries', [EmployeeSalaryController::class, 'index']);
    Route::post('/employee-salaries', [EmployeeSalaryController::class, 'store']);
    Route::put('/employee-salaries/{employeeSalary}', [EmployeeSalaryController::class, 'update']);
    Route::patch('/employee-salaries/{employeeSalary}', [EmployeeSalaryController::class, 'update']);
    Route::delete('/employee-salaries/{employeeSalary}', [EmployeeSalaryController::class, 'destroy']);

    Route::get('/salary-histories', [SalaryHistoryController::class, 'index']);
    Route::get('/salary-bulk-updates', [SalaryBulkUpdateController::class, 'index']);
    Route::post('/salary-bulk-updates', [SalaryBulkUpdateController::class, 'store']);
});
