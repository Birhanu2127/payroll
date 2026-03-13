<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserAccountController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::orderByDesc('id')->get();

        return response()->json([
            'data' => $users->map(fn (User $user) => $this->serialize($user)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request);

        $user = User::create([
            'name' => $validated['name'],
            'employee_name' => $validated['employeeName'] ?? null,
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'department' => $validated['department'] ?? null,
            'role' => $validated['role'],
            'status' => $validated['status'] ?? 'Active',
            'password' => $validated['password'],
        ]);

        $this->logAction($request, 'Created User Account', 'User Accounts');

        return response()->json([
            'data' => $this->serialize($user),
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $this->validatePayload($request, $user);

        $payload = [];
        $this->setIfPresent($payload, $validated, 'name', 'name');
        $this->setIfPresent($payload, $validated, 'employeeName', 'employee_name');
        $this->setIfPresent($payload, $validated, 'email', 'email');
        $this->setIfPresent($payload, $validated, 'phone', 'phone');
        $this->setIfPresent($payload, $validated, 'department', 'department');
        $this->setIfPresent($payload, $validated, 'role', 'role');
        $this->setIfPresent($payload, $validated, 'status', 'status');

        if (! empty($payload)) {
            $user->fill($payload);
            $user->save();
        }

        $this->logAction($request, 'Updated User Account', 'User Accounts');

        return response()->json([
            'data' => $this->serialize($user->fresh()),
        ]);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user->password = $validated['password'];
        $user->save();

        $this->logAction($request, 'Reset User Password', 'User Accounts');

        return response()->json([
            'data' => $this->serialize($user->fresh()),
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $user->delete();

        $this->logAction($request, 'Deleted User Account', 'User Accounts');

        return response()->json([], 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePayload(Request $request, ?User $user = null): array
    {
        $required = $user ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:255'],
            'employeeName' => [$user ? 'sometimes' : 'nullable', 'nullable', 'string', 'max:255'],
            'email' => [$required, 'email', 'max:255', Rule::unique('users', 'email')->ignore($user)],
            'phone' => [$user ? 'sometimes' : 'nullable', 'nullable', 'string', 'max:50'],
            'department' => [$user ? 'sometimes' : 'nullable', 'nullable', 'string', 'max:255'],
            'role' => [$required, 'string', 'max:50'],
            'status' => [$user ? 'sometimes' : 'nullable', 'nullable', Rule::in(['Active', 'Inactive'])],
            'password' => [$user ? 'sometimes' : 'required', 'string', 'min:8'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'employeeName' => $user->employee_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'department' => $user->department,
            'role' => $user->role,
            'status' => $user->status,
            'lastLogin' => $user->last_login_at?->toDateTimeString(),
            'createdDate' => $user->created_at?->toDateTimeString(),
        ];
    }

    private function logAction(Request $request, string $action, string $module): void
    {
        $actor = $request->user();

        ActivityLog::create([
            'user_id' => $actor?->id,
            'user_name' => $actor?->name,
            'role_name' => $actor?->role,
            'action' => $action,
            'module' => $module,
            'ip_address' => $request->ip(),
            'device' => $request->header('User-Agent'),
            'user_agent' => $request->header('User-Agent'),
            'created_at' => now(),
        ]);
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
