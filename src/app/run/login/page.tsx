import { redirect } from "next/navigation";
import { paseActual } from "@/lib/run/staff";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {

    return (
        <main className="flex min-h-svh items-center justify-center px-4 py-10 sm:px-6">
            <div className="w-full max-w-sm">
                <div className="text-center">
                    <h1 className="font-schabo text-[clamp(2rem,6vw,3rem)] uppercase leading-none">
                        Acceso staff
                    </h1>
                    <p className="mt-2 font-geist-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
                        Solo personal autorizado
                    </p>
                </div>

                <div className="mt-8 rounded-[20px] border border-white/10 bg-run-card px-6 py-6">
                    <LoginForm />
                </div>
            </div>
        </main>
    );
}