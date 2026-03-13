<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeSalary;
use App\Models\SalaryHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeSalaryController extends Controller
{
    public function index(): JsonResponse
    {
        $salaries = EmployeeSalary::with(['employee', 'grade', 'template'])->orderByDesc('id')->get();

        return response()->json([
            'data' => $salaries->map(fn (EmployeeSalary $salary) => $this->serialize($salary)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request);

        /** @var Employee $employee */
        $employee = Employee::findOrFail($validated['employeeId']);
        $payload = $this->mapPayload($validated, $request->user()?->id, true);

        $salary = EmployeeSalary::create($payload);
        $this->recordHistory($employee->id, null, $salary->net_salary, $validated, $request->user()?->id);

        return response()->json([
            'data' => $this->serialize($salary->fresh(['employee', 'grade', 'template'])),
        ], 201);
    }

    public function update(Request $request, EmployeeSalary $employeeSalary): JsonResponse
    {
        $validated = $this->validatePayload($request, true);

        $oldSalary = $employeeSalary->net_salary;
        $employeeSalary->fill($this->mapPayload($validated, $request->user()?->id, false));
        $employeeSalary->save();

        $this->recordHistory(
            $employeeSalary->employee_id,
            $oldSalary,
            $employeeSalary->net_salary,
            $validated,
            $request->user()?->id,
        );

        return response()->json([
            'data' => $this->serialize($employeeSalary->fresh(['employee', 'grade', 'template'])),
        ]);
    }

    public function destroy(EmployeeSalary $employeeSalary): JsonResponse
    {
        $employeeSalary->delete();

        return response()->json([], 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'employeeId' => [$required, 'integer', 'exists:employees,id'],
            'salaryGradeId' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'integer', 'exists:salary_grades,id'],
            'salaryTemplateId' => [
                $partial ? 'sometimes' : 'nullable',
                'nullable',
                'integer',
                'exists:salary_templates,id',
            ],
            'basicSalary' => [$required, 'numeric', 'min:0'],
            'allowancesTotal' => [$required, 'numeric', 'min:0'],
            'deductionsTotal' => [$required, 'numeric', 'min:0'],
            'netSalary' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'numeric', 'min:0'],
            'paymentFrequency' => [$required, 'string', 'max:50'],
            'effectiveDate' => [$required, 'date'],
            'status' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'in:Active,Inactive'],
            'changeReason' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'string', 'max:255'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function mapPayload(array $validated, ?int $userId, bool $isCreate): array
    {
        $payload = [];
        $this->setIfPresent($payload, $validated, 'employeeId', 'employee_id');
        $this->setIfPresent($payload, $validated, 'salaryGradeId', 'salary_grade_id');
        $this->setIfPresent($payload, $validated, 'salaryTemplateId', 'salary_template_id');
        $this->setIfPresent($payload, $validated, 'basicSalary', 'basic_salary');
        $this->setIfPresent($payload, $validated, 'allowancesTotal', 'allowances_total');
        $this->setIfPresent($payload, $validated, 'deductionsTotal', 'deductions_total');
        $this->setIfPresent($payload, $validated, 'paymentFrequency', 'payment_frequency');
        $this->setIfPresent($payload, $validated, 'effectiveDate', 'effective_date');
        $this->setIfPresent($payload, $validated, 'status', 'status');

        if (array_key_exists('netSalary', $validated)) {
            $payload['net_salary'] = $validated['netSalary'] ?? 0;
        } elseif (isset($payload['basic_salary'], $payload['allowances_total'], $payload['deductions_total'])) {
            $payload['net_salary'] =
                $payload['basic_salary'] + $payload['allowances_total'] - $payload['deductions_total'];
        }

        if ($userId && $isCreate) {
            $payload['created_by'] = $userId;
        }

        if ($isCreate) {
            $payload['status'] ??= 'Active';
        }

        return $payload;
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function recordHistory(
        int $employeeId,
        ?float $oldSalary,
        float $newSalary,
        array $validated,
        ?int $userId,
    ): void {
        SalaryHistory::create([
            'employee_id' => $employeeId,
            'old_salary' => $oldSalary,
            'new_salary' => $newSalary,
            'change_reason' => $validated['changeReason'] ?? null,
            'effective_date' => $validated['effectiveDate'] ?? null,
            'updated_by' => $userId,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(EmployeeSalary $salary): array
    {
        return [
            'id' => $salary->id,
            'employeeId' => $salary->employee_id,
            'employeeName' => $salary->employee?->name,
            'employeeCode' => $salary->employee?->employee_id,
            'department' => $salary->employee?->department,
            'salaryGradeId' => $salary->salary_grade_id,
            'salaryGradeName' => $salary->grade?->name,
            'salaryTemplateId' => $salary->salary_template_id,
            'salaryTemplateName' => $salary->template?->name,
            'basicSalary' => $salary->basic_salary,
            'allowancesTotal' => $salary->allowances_total,
            'deductionsTotal' => $salary->deductions_total,
            'netSalary' => $salary->net_salary,
            'paymentFrequency' => $salary->payment_frequency,
            'effectiveDate' => $salary->effective_date?->toDateString(),
            'status' => $salary->status,
            'createdDate' => $salary->created_at?->toDateString(),
        ];
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
