<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalaryGrade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalaryGradeController extends Controller
{
    public function index(): JsonResponse
    {
        $grades = SalaryGrade::orderBy('level')->orderBy('name')->get();

        return response()->json([
            'data' => $grades->map(fn (SalaryGrade $grade) => $this->serialize($grade)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request);
        $payload = $this->mapPayload($validated);
        $payload['status'] ??= 'Active';
        $payload['created_date'] ??= now()->toDateString();

        $grade = SalaryGrade::create($payload);

        return response()->json([
            'data' => $this->serialize($grade),
        ], 201);
    }

    public function update(Request $request, SalaryGrade $salaryGrade): JsonResponse
    {
        $validated = $this->validatePayload($request, true);
        $salaryGrade->fill($this->mapPayload($validated));
        $salaryGrade->save();

        return response()->json([
            'data' => $this->serialize($salaryGrade->fresh()),
        ]);
    }

    public function destroy(SalaryGrade $salaryGrade): JsonResponse
    {
        $salaryGrade->delete();

        return response()->json([], 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:255'],
            'level' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'string', 'max:50'],
            'minSalary' => [$required, 'numeric', 'min:0'],
            'maxSalary' => [$required, 'numeric', 'min:0'],
            'description' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'string'],
            'status' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'in:Active,Inactive'],
            'createdDate' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'date'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function mapPayload(array $validated): array
    {
        $payload = [];

        $this->setIfPresent($payload, $validated, 'name', 'name');
        $this->setIfPresent($payload, $validated, 'level', 'level');
        $this->setIfPresent($payload, $validated, 'minSalary', 'min_salary');
        $this->setIfPresent($payload, $validated, 'maxSalary', 'max_salary');
        $this->setIfPresent($payload, $validated, 'description', 'description');
        $this->setIfPresent($payload, $validated, 'status', 'status');
        $this->setIfPresent($payload, $validated, 'createdDate', 'created_date');

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(SalaryGrade $grade): array
    {
        return [
            'id' => $grade->id,
            'name' => $grade->name,
            'level' => $grade->level,
            'minSalary' => $grade->min_salary,
            'maxSalary' => $grade->max_salary,
            'description' => $grade->description,
            'status' => $grade->status,
            'createdDate' => $grade->created_date?->toDateString() ?? $grade->created_at?->toDateString(),
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
