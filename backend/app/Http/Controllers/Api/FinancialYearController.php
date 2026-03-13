<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinancialYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinancialYearController extends Controller
{
    public function index(): JsonResponse
    {
        $years = FinancialYear::orderByDesc('start_date')->orderByDesc('id')->get();

        return response()->json([
            'data' => $years->map(fn (FinancialYear $year) => $this->serialize($year)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request);
        $payload = $this->mapPayload($validated);

        $year = FinancialYear::create($payload);

        if ($year->is_active) {
            FinancialYear::where('id', '!=', $year->id)->update(['is_active' => false]);
        }

        return response()->json([
            'data' => $this->serialize($year),
        ], 201);
    }

    public function update(Request $request, FinancialYear $financialYear): JsonResponse
    {
        $validated = $this->validatePayload($request, true);
        $payload = $this->mapPayload($validated);

        if (! empty($payload)) {
            $financialYear->fill($payload);
            $financialYear->save();
        }

        if (array_key_exists('is_active', $payload) && $payload['is_active']) {
            FinancialYear::where('id', '!=', $financialYear->id)->update(['is_active' => false]);
        }

        return response()->json([
            'data' => $this->serialize($financialYear->fresh()),
        ]);
    }

    public function destroy(FinancialYear $financialYear): JsonResponse
    {
        $financialYear->delete();

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
            'startDate' => [$required, 'date'],
            'endDate' => [$required, 'date', 'after_or_equal:startDate'],
            'isActive' => [$partial ? 'sometimes' : 'nullable', 'boolean'],
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
        $this->setIfPresent($payload, $validated, 'startDate', 'start_date');
        $this->setIfPresent($payload, $validated, 'endDate', 'end_date');
        $this->setIfPresent($payload, $validated, 'isActive', 'is_active');

        return $payload;
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(FinancialYear $year): array
    {
        return [
            'id' => $year->id,
            'name' => $year->name,
            'startDate' => $year->start_date?->toDateString(),
            'endDate' => $year->end_date?->toDateString(),
            'isActive' => $year->is_active,
            'createdDate' => $year->created_at?->toDateString(),
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
