<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['required', 'in:superadmin,hr'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => $validated['role'],
        ]);

        $plainTextToken = $this->issueToken($user);
        $user->last_login_at = now();
        $user->save();

        return response()->json([
            'message' => 'Account created successfully.',
            'token' => $plainTextToken,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid email or password.',
            ], 422);
        }

        if ($user->status === 'Inactive') {
            return response()->json([
                'message' => 'Your account is inactive. Please contact an administrator.',
            ], 403);
        }

        $plainTextToken = $this->issueToken($user);
        $user->last_login_at = now();
        $user->save();

        return response()->json([
            'message' => 'Login successful.',
            'token' => $plainTextToken,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $plainTextToken = $request->bearerToken();

        if ($plainTextToken) {
            DB::table('api_tokens')
                ->where('token_hash', hash('sha256', $plainTextToken))
                ->delete();
        }

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    private function issueToken(User $user): string
    {
        $plainTextToken = Str::random(80);

        DB::table('api_tokens')->insert([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $plainTextToken),
            'last_used_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $plainTextToken;
    }
}
