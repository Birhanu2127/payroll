<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalaryHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalaryHistoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SalaryHistory::with(['employee', 'updatedBy'])->orderByDesc('id');

        if ($request->filled('employeeId')) {
            $query->where('employee_id', $request->input('employeeId'));
        }

        if ($request->filled('from')) {
            $query->whereDate('effective_date', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('effective_date', '<=', $request->input('to'));
        }

        $histories = $query->get();

        return response()->json([
            'data' => $histories->map(fn (SalaryHistory $history) => [
                'id' => $history->id,
                'employeeId' => $history->employee_id,
                'employeeName' => $history->employee?->name,
                'employeeCode' => $history->employee?->employee_id,
                'oldSalary' => $history->old_salary,
                'newSalary' => $history->new_salary,
                'changeReason' => $history->change_reason,
                'effectiveDate' => $history->effective_date?->toDateString(),
                'updatedBy' => $history->updatedBy?->name,
                'createdDate' => $history->created_at?->toDateString(),
            ]),
        ]);
    }
}
