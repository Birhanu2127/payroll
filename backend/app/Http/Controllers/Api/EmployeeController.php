<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    public function index(): JsonResponse
    {
        $employees = Employee::orderByDesc('id')->get();

        return response()->json([
            'data' => $employees->map(fn (Employee $employee) => $this->serializeEmployee($employee)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request);

        $employee = Employee::create($this->mapPayload($validated, true));

        return response()->json([
            'data' => $this->serializeEmployee($employee),
        ], 201);
    }

    public function update(Request $request, Employee $employee): JsonResponse
    {
        $validated = $this->validatePayload($request, $employee);
        $payload = $this->mapPayload($validated, false);

        if (! empty($payload)) {
            $employee->fill($payload);
            $employee->save();
        }

        return response()->json([
            'data' => $this->serializeEmployee($employee->fresh()),
        ]);
    }

    public function destroy(Employee $employee): JsonResponse
    {
        $employee->delete();

        return response()->json([], 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request, ?Employee $employee = null): array
    {
        $required = $employee ? 'sometimes' : 'required';
        $employeeIdRule = Rule::unique('employees', 'employee_id');

        if ($employee) {
            $employeeIdRule->ignore($employee->id);
        }

        return $request->validate([
            'name' => [$required, 'string', 'max:255'],
            'employeeId' => [
                $required,
                'string',
                'max:50',
                $employeeIdRule,
            ],
            'email' => [$employee ? 'sometimes' : 'nullable', 'nullable', 'email', 'max:255'],
            'phone' => [$employee ? 'sometimes' : 'nullable', 'nullable', 'string', 'max:50'],
            'department' => [$required, 'string', 'max:255'],
            'position' => [$required, 'string', 'max:255'],
            'employmentType' => [$required, 'string', 'max:100'],
            'joinDate' => [$employee ? 'sometimes' : 'nullable', 'nullable', 'date'],
            'status' => [$employee ? 'sometimes' : 'nullable', 'nullable', Rule::in(['Active', 'Inactive'])],
            'attendance' => [$employee ? 'sometimes' : 'nullable', 'nullable', 'string', 'max:50'],
            'gender' => [$employee ? 'sometimes' : 'nullable', 'nullable', 'string', 'max:50'],
            'dateOfBirth' => [$employee ? 'sometimes' : 'nullable', 'nullable', 'date'],
            'address' => [$employee ? 'sometimes' : 'nullable', 'nullable', 'string', 'max:255'],
            'manager' => [$employee ? 'sometimes' : 'nullable', 'nullable', 'string', 'max:255'],
            'role' => [$employee ? 'sometimes' : 'nullable', 'nullable', 'string', 'max:50'],
            'avatarHue' => [$employee ? 'sometimes' : 'nullable', 'nullable', 'integer', 'between:0,360'],
            'createdDate' => [$employee ? 'sometimes' : 'nullable', 'nullable', 'date'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function mapPayload(array $validated, bool $isCreate): array
    {
        $mapped = [];

        $this->setIfPresent($mapped, $validated, 'name', 'name');
        $this->setIfPresent($mapped, $validated, 'employeeId', 'employee_id');
        $this->setIfPresent($mapped, $validated, 'email', 'email');
        $this->setIfPresent($mapped, $validated, 'phone', 'phone');
        $this->setIfPresent($mapped, $validated, 'department', 'department');
        $this->setIfPresent($mapped, $validated, 'position', 'position');
        $this->setIfPresent($mapped, $validated, 'employmentType', 'employment_type');
        $this->setIfPresent($mapped, $validated, 'joinDate', 'join_date');
        $this->setIfPresent($mapped, $validated, 'status', 'status');
        $this->setIfPresent($mapped, $validated, 'attendance', 'attendance');
        $this->setIfPresent($mapped, $validated, 'gender', 'gender');
        $this->setIfPresent($mapped, $validated, 'dateOfBirth', 'date_of_birth');
        $this->setIfPresent($mapped, $validated, 'address', 'address');
        $this->setIfPresent($mapped, $validated, 'manager', 'manager');
        $this->setIfPresent($mapped, $validated, 'role', 'role');
        $this->setIfPresent($mapped, $validated, 'avatarHue', 'avatar_hue');
        $this->setIfPresent($mapped, $validated, 'createdDate', 'created_date');

        if ($isCreate) {
            $mapped['status'] ??= 'Active';
            $mapped['employment_type'] ??= 'Full-time';
            $mapped['role'] ??= 'Employee';
            $mapped['created_date'] ??= now()->toDateString();
            $mapped['join_date'] ??= now()->toDateString();
            $mapped['avatar_hue'] ??= random_int(40, 260);
        }

        return $mapped;
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

    /**
     * @return array<string, mixed>
     */
    private function serializeEmployee(Employee $employee): array
    {
        return [
            'id' => $employee->id,
            'name' => $employee->name,
            'employeeId' => $employee->employee_id,
            'email' => $employee->email,
            'phone' => $employee->phone,
            'department' => $employee->department,
            'position' => $employee->position,
            'employmentType' => $employee->employment_type,
            'joinDate' => $employee->join_date?->toDateString(),
            'status' => $employee->status,
            'attendance' => $employee->attendance,
            'gender' => $employee->gender,
            'dateOfBirth' => $employee->date_of_birth?->toDateString(),
            'address' => $employee->address,
            'manager' => $employee->manager,
            'role' => $employee->role,
            'createdDate' => $employee->created_date?->toDateString()
                ?? $employee->created_at?->toDateString(),
            'avatarHue' => $employee->avatar_hue,
        ];
    }
}
