<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalaryTemplate;
use App\Models\SalaryTemplateItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalaryTemplateController extends Controller
{
    public function index(): JsonResponse
    {
        $templates = SalaryTemplate::with('items')->orderBy('name')->get();

        return response()->json([
            'data' => $templates->map(fn (SalaryTemplate $template) => $this->serialize($template)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request);

        $template = DB::transaction(function () use ($validated): SalaryTemplate {
            [$templatePayload, $items] = $this->mapPayload($validated, true);
            $template = SalaryTemplate::create($templatePayload);
            $this->syncItems($template, $items);

            return $template->fresh('items');
        });

        return response()->json([
            'data' => $this->serialize($template),
        ], 201);
    }

    public function update(Request $request, SalaryTemplate $salaryTemplate): JsonResponse
    {
        $validated = $this->validatePayload($request, true);

        $template = DB::transaction(function () use ($validated, $salaryTemplate): SalaryTemplate {
            [$templatePayload, $items] = $this->mapPayload($validated, false);

            if ($items === null && array_key_exists('basic_salary', $templatePayload)) {
                $existingItems = $salaryTemplate->items->map(fn (SalaryTemplateItem $item) => [
                    'type' => $item->type,
                    'name' => $item->name,
                    'amount' => $item->amount,
                ])->all();
                $totals = $this->calculateTotals($templatePayload['basic_salary'], $existingItems);
                $templatePayload['total_earnings'] = $totals['total_earnings'];
                $templatePayload['total_deductions'] = $totals['total_deductions'];
                $templatePayload['net_salary'] = $totals['net_salary'];
            }

            $salaryTemplate->fill($templatePayload);
            $salaryTemplate->save();

            if ($items !== null) {
                $this->syncItems($salaryTemplate, $items);
            }

            return $salaryTemplate->fresh('items');
        });

        return response()->json([
            'data' => $this->serialize($template),
        ]);
    }

    public function destroy(SalaryTemplate $salaryTemplate): JsonResponse
    {
        $salaryTemplate->delete();

        return response()->json([], 204);
    }

    /**
     * @return array{0: array<string, mixed>, 1: array<int, array<string, mixed>>|null}
     */
    private function mapPayload(array $validated, bool $isCreate): array
    {
        $payload = [];
        $this->setIfPresent($payload, $validated, 'name', 'name');
        $this->setIfPresent($payload, $validated, 'basicSalary', 'basic_salary');
        $this->setIfPresent($payload, $validated, 'description', 'description');
        $this->setIfPresent($payload, $validated, 'status', 'status');
        $this->setIfPresent($payload, $validated, 'createdDate', 'created_date');

        $items = null;

        if (array_key_exists('earnings', $validated) || array_key_exists('deductions', $validated)) {
            $items = [];

            foreach ($validated['earnings'] ?? [] as $item) {
                $items[] = [
                    'type' => 'earning',
                    'name' => $item['name'],
                    'amount' => $item['amount'],
                ];
            }

            foreach ($validated['deductions'] ?? [] as $item) {
                $items[] = [
                    'type' => 'deduction',
                    'name' => $item['name'],
                    'amount' => $item['amount'],
                ];
            }
        }

        if ($items !== null) {
            $totals = $this->calculateTotals($payload['basic_salary'] ?? 0, $items);
            $payload['total_earnings'] = $totals['total_earnings'];
            $payload['total_deductions'] = $totals['total_deductions'];
            $payload['net_salary'] = $totals['net_salary'];
        } elseif (array_key_exists('basic_salary', $payload)) {
            $payload['total_earnings'] ??= 0;
            $payload['total_deductions'] ??= 0;
            $payload['net_salary'] = $payload['basic_salary'];
        }

        if ($isCreate) {
            $payload['status'] ??= 'Active';
            $payload['created_date'] ??= now()->toDateString();
        }

        return [$payload, $items];
    }

    /**
     * @return array<string, mixed>
     */
    private function calculateTotals(float $basicSalary, array $items): array
    {
        $totalEarnings = 0.0;
        $totalDeductions = 0.0;

        foreach ($items as $item) {
            if ($item['type'] === 'earning') {
                $totalEarnings += $item['amount'];
            }

            if ($item['type'] === 'deduction') {
                $totalDeductions += $item['amount'];
            }
        }

        return [
            'total_earnings' => $totalEarnings,
            'total_deductions' => $totalDeductions,
            'net_salary' => $basicSalary + $totalEarnings - $totalDeductions,
        ];
    }

    private function syncItems(SalaryTemplate $template, array $items): void
    {
        $template->items()->delete();

        $template->items()->createMany(
            array_map(
                fn (array $item) => [
                    'type' => $item['type'],
                    'name' => $item['name'],
                    'amount' => $item['amount'],
                ],
                $items,
            ),
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:255'],
            'basicSalary' => [$required, 'numeric', 'min:0'],
            'description' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'string'],
            'status' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'in:Active,Inactive'],
            'createdDate' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'date'],
            'earnings' => [$partial ? 'sometimes' : 'nullable', 'array'],
            'earnings.*.name' => ['required_with:earnings', 'string', 'max:255'],
            'earnings.*.amount' => ['required_with:earnings', 'numeric', 'min:0'],
            'deductions' => [$partial ? 'sometimes' : 'nullable', 'array'],
            'deductions.*.name' => ['required_with:deductions', 'string', 'max:255'],
            'deductions.*.amount' => ['required_with:deductions', 'numeric', 'min:0'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(SalaryTemplate $template): array
    {
        $earnings = $template->items->where('type', 'earning')->values();
        $deductions = $template->items->where('type', 'deduction')->values();

        return [
            'id' => $template->id,
            'name' => $template->name,
            'basicSalary' => $template->basic_salary,
            'totalEarnings' => $template->total_earnings,
            'totalDeductions' => $template->total_deductions,
            'netSalary' => $template->net_salary,
            'description' => $template->description,
            'status' => $template->status,
            'createdDate' => $template->created_date?->toDateString() ?? $template->created_at?->toDateString(),
            'earnings' => $earnings->map(fn (SalaryTemplateItem $item) => [
                'id' => $item->id,
                'name' => $item->name,
                'amount' => $item->amount,
            ]),
            'deductions' => $deductions->map(fn (SalaryTemplateItem $item) => [
                'id' => $item->id,
                'name' => $item->name,
                'amount' => $item->amount,
            ]),
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
