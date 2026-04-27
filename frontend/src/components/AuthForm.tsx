import React, { useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"

type ResetPayload = {
  reset_method: "key" | "question"
  reset_key?: string
  security_question?: string
  security_answer?: string
}

type FormData = {
  email: string
  password: string
} & ResetPayload

interface Props {
  onSubmit: (data: FormData) => void
  buttonText: string
  disabled?: boolean
  passwordError?: string
  initialEmail?: string
  initialPassword?: string
  enablePasswordGeneration?: boolean
}

const fieldClass =
  "w-full px-4 py-3 rounded-lg outline-none transition " +
  "bg-white text-slate-700 border border-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 " +
  "dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"

export default function AuthForm({
  onSubmit,
  buttonText,
  passwordError,
  disabled,
  initialEmail = "",
  initialPassword = "",
  enablePasswordGeneration = false,
}: Props) {

  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState(initialPassword)
  const [confirmPassword, setConfirmPassword] = useState(initialPassword)
  const [localError, setLocalError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [resetMethod, setResetMethod] = useState<"key" | "question">("key")
  const [resetKey, setResetKey] = useState("")
  const [securityQuestion, setSecurityQuestion] = useState("")
  const [securityAnswer, setSecurityAnswer] = useState("")
  const [keyError, setKeyError] = useState("")
  const [questionError, setQuestionError] = useState("")

  const validateClientPassword = (pwd: string) => {
    if (pwd.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pwd)) return "Must include at least one uppercase letter";
    if (!/[a-z]/.test(pwd)) return "Must include at least one lowercase letter";
    if (!/[0-9]/.test(pwd)) return "Must include at least one number";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Must include a special character";
    return "";
  };
  const passwordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[!@#$%^&*(),.?\":{}|<>]/.test(pwd)) score++;

    if (score <= 2) return "Weak";
    if (score === 3 || score === 4) return "Medium";
    return "Strong";
  };

  useEffect(() => {
    if (!password && !confirmPassword) {
      setLocalError("");
      return;
    }
    const enc = new TextEncoder().encode(password);
    if (enc.length > 72) {
      const truncated = new TextDecoder().decode(enc.slice(0, 72));
      setPassword(truncated);
      setConfirmPassword(truncated);
      setLocalError("Password too long, truncated to 72 bytes");
      return;
    }
    const err = validateClientPassword(password);
    if (err) {
      setLocalError(err);
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }
    setLocalError("");
  }, [password, confirmPassword]);

  const generatePassword = () => {
    const length = 12;
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const special = '!@#$%^&*()_+{}[]<>?,.';
    const all = lower + upper + nums + special;
    let pwd = '';
    pwd += lower[Math.floor(Math.random() * lower.length)];
    pwd += upper[Math.floor(Math.random() * upper.length)];
    pwd += nums[Math.floor(Math.random() * nums.length)];
    pwd += special[Math.floor(Math.random() * special.length)];
    for (let i = pwd.length; i < length; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }
    pwd = pwd.split('').sort(() => 0.5 - Math.random()).join('');
    if (new TextEncoder().encode(pwd).length > 72) {
      pwd = pwd.slice(0, 72);
    }
    setPassword(pwd);
    setConfirmPassword(pwd);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const err = validateClientPassword(password)
    if (err) {
      setLocalError(err)
      return
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match")
      return
    }

    if (resetMethod === "key") {
      if (!resetKey.match(/^[A-Za-z0-9_-]{6,32}$/)) {
        setKeyError("Key must be 6-32 characters, letters/digits/-/_")
        return
      }
      setKeyError("")
    } else {
      if (!securityQuestion.trim()) {
        setQuestionError("Security question cannot be empty")
        return
      }
      if (securityAnswer.trim().length < 3) {
        setQuestionError("Security answer must be at least 3 characters")
        return
      }
      setQuestionError("")
    }

    setLocalError("")
    let outPwd = password
    const encoded = new TextEncoder().encode(outPwd)
    if (encoded.length > 72) {
      outPwd = new TextDecoder().decode(encoded.slice(0, 72))
    }

    const payload: FormData = {
      email: email.trim(),
      password: outPwd,
      reset_method: resetMethod,
      ...(resetMethod === "key" ? { reset_key: resetKey } : {
        security_question: securityQuestion,
        security_answer: securityAnswer,
      }),
    }

    onSubmit(payload)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 w-full"
    >
      <div className="flex flex-col">
        <label className="text-sm text-slate-600 dark:text-slate-300 mb-1">
          Email Address
        </label>
        <input
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-sm text-slate-600 dark:text-slate-300 mb-1">
          Password
        </label>

        <div className="relative w-full">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            maxLength={72}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={`${fieldClass} pr-10`}
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 dark:text-slate-400 cursor-pointer"
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </span>
        </div>

        <div className="flex flex-col mt-3">
          <label className="text-sm text-slate-600 dark:text-slate-300 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter password"
              value={confirmPassword}
              maxLength={72}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={`${fieldClass} pr-10`}
            />
            <span
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-500 dark:text-slate-400 cursor-pointer"
            >
              {showConfirm ? <EyeOff /> : <Eye />}
            </span>
          </div>
        </div>
        {password && (
          <p className="text-xs italic text-slate-500 dark:text-slate-400 text-end mt-1">
            Strength: <span className="font-semibold">{passwordStrength(password)}</span>
          </p>
        )}

        {enablePasswordGeneration && (
          <button
            type="button"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 self-end"
            onClick={generatePassword}
          >
            Generate strong password
          </button>
        )}
        {localError && (
          <p className="text-rose-500 text-sm mt-1">
            {localError}
          </p>
        )}

        {passwordError && !localError && (
          <p className="text-rose-500 text-sm mt-1">
            {passwordError}
          </p>
        )}
        <div className="mt-3">
          <label className="text-sm text-slate-600 dark:text-slate-300">Reset Method</label>
          <select
            value={resetMethod}
            onChange={(e) => setResetMethod(e.target.value as "key" | "question")}
            className={`${fieldClass} mt-1`}
          >
            <option value="key">Reset Key</option>
            <option value="question">Security Question</option>
          </select>
        </div>
        {resetMethod === "key" ? (
          <div className="mt-3 mb-2">
            <label className="text-sm text-slate-600 dark:text-slate-300">Reset Key</label>
            <input
              type="text"
              value={resetKey}
              onChange={(e) => setResetKey(e.target.value)}
              placeholder="6-32 letters, digits, - or _"
              className={`${fieldClass} mt-1`}
            />
            {keyError && <p className="text-rose-500 text-sm mt-1">{keyError}</p>}
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Security Question</label>
              <select
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                className={`${fieldClass} mt-1`}
              >
                <option value="">Select a security question</option>
                <option value="What is your mother\'s maiden name?">What is your mother’s maiden name?</option>
                <option value="What was your first pet\'s name?">What was your first pet’s name?</option>
                <option value="What was the name of your first school?">What was the name of your first school?</option>
                <option value="What is your favorite color?">What is your favorite color?</option>
                <option value="What city were you born in?">What city were you born in?</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-600 dark:text-slate-300">Security Answer</label>
              <input
                type="text"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder="Enter your answer"
                className={`${fieldClass} mt-1`}
              />
            </div>

            {questionError && (
              <p className="text-rose-500 text-sm">{questionError}</p>
            )}
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={
          !!localError ||
          !email ||
          !password ||
          !confirmPassword ||
          disabled
        }
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buttonText}
      </button>
    </form>
  )
}
