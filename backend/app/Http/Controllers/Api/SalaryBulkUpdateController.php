<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmployeeSalary;
use App\Models\SalaryBulkUpdate;
use App\Models\SalaryHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalaryBulkUpdateController extends Controller
{
    public function index(): JsonResponse
    {
        $updates = SalaryBulkUpdate::with('grade')->orderByDesc('id')->get();

        return response()->json([
            'data' => $updates->map(fn (SalaryBulkUpdate $update) => [
                'id' => $update->id,
                'department' => $update->department,
                'salaryGradeId' => $update->salary_grade_id,
                'salaryGradeName' => $update->grade?->name,
                'increaseType' => $update->increase_type,
                'increaseValue' => $update->increase_value,
                'effectiveDate' => $update->effective_date?->toDateString(),
                'createdDate' => $update->created_at?->toDateString(),
            ]),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request);

        $update = SalaryBulkUpdate::create([
            'department' => $validated['department'] ?? null,
            'salary_grade_id' => $validated['salaryGradeId'] ?? null,
            'increase_type' => $validated['increaseType'],
            'increase_value' => $validated['increaseValue'],
            'effective_date' => $validated['effectiveDate'],
            'created_by' => $request->user()?->id,
        ]);

        $query = EmployeeSalary::with('employee');

        if (! empty($validated['salaryGradeId'])) {
            $query->where('salary_grade_id', $validated['salaryGradeId']);
        }

        if (! empty($validated['department'])) {
            $query->whereHas('employee', function ($builder) use ($validated): void {
                $builder->where('department', $validated['department']);
            });
        }

        $affected = 0;

        foreach ($query->get() as $salary) {
            $oldSalary = $salary->net_salary;
            $newSalary = $this->applyIncrease($oldSalary, $validated['increaseType'], $validated['increaseValue']);
            $salary->net_salary = $newSalary;
            $salary->basic_salary = $this->applyIncrease(
                $salary->basic_salary,
                $validated['increaseType'],
                $validated['increaseValue'],
            );
            $salary->effective_date = $validated['effectiveDate'];
            $salary->save();

            SalaryHistory::create([
                'employee_id' => $salary->employee_id,
                'old_salary' => $oldSalary,
                'new_salary' => $newSalary,
                'change_reason' => 'Bulk update',
                'effective_date' => $validated['effectiveDate'],
                'updated_by' => $request->user()?->id,
            ]);

            $affected += 1;
        }

        return response()->json([
            'data' => [
                'bulkUpdateId' => $update->id,
                'affectedEmployees' => $affected,
            ],
        ], 201);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'department' => ['nullable', 'string', 'max:255'],
            'salaryGradeId' => ['nullable', 'integer', 'exists:salary_grades,id'],
            'increaseType' => ['required', 'string', 'in:percentage,fixed'],
            'increaseValue' => ['required', 'numeric', 'min:0'],
            'effectiveDate' => ['required', 'date'],
        ]);
    }

    private function applyIncrease(float $current, string $type, float $value): float
    {
        if ($type === 'percentage') {
            return $current + ($current * ($value / 100));
        }

        return $current + $value;
    }
}
