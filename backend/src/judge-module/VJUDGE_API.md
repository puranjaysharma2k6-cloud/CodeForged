# VJUDGE_API_REFERENCE
# Source: starcatmeow/vjudge-api (MIT) + CUP-Online-Judge-Vjudge (Apache-2.0)
# Use this file to implement the three TODOs in VjudgeProvider.ts:
#   ensureLoggedIn(), submit(), getVerdict()

---

ENDPOINT[1] LOGIN
  METHOD: POST
  URL: https://vjudge.net/user/login
  CONTENT_TYPE: application/x-www-form-urlencoded
  BODY_FIELDS:
    username = <account.username>
    password = <account.password>
  SUCCESS_RESPONSE: plain string "success"
  FAILURE_RESPONSE: plain string e.g. "username or password error"
  SIDE_EFFECT: server sets Set-Cookie header with JSESSIONID session cookie
  ACTION: extract cookie from Set-Cookie and store as account.sessionCookie
  USAGE_IN_CODE: call inside ensureLoggedIn() when account.sessionCookie is null

---

ENDPOINT[2] CHECK_SESSION
  METHOD: POST
  URL: https://vjudge.net/user/checkLogInStatus
  HEADERS:
    Cookie: <account.sessionCookie>
  SUCCESS_RESPONSE: boolean true
  FAILURE_RESPONSE: boolean false
  NOTE: sessions expire after ~15 minutes of inactivity
  ACTION: if false, call ENDPOINT[1] again to refresh session cookie
  USAGE_IN_CODE: call at top of ensureLoggedIn() before checking if cookie exists

---

ENDPOINT[3] SUBMIT_CODE
  METHOD: POST
  URL: https://vjudge.net/contest/submit/<contestId>/<problemNum>
  CONTENT_TYPE: application/x-www-form-urlencoded
  HEADERS:
    Cookie: <account.sessionCookie>
  BODY_FIELDS:
    method   = 0
    language = <language string>  SEE LANGUAGE_MAP below
    open     = 0
    source   = <double-encoded source>  SEE SOURCE_ENCODING below
    captcha  = ""
    password = ""
  URL_PARAMS:
    contestId  = integer, the vjudge contest ID from externalProblemCode
    problemNum = letter A/B/C..., the problem letter from externalProblemCode
  SUCCESS_RESPONSE: JSON { "runId": <number> }
  FAILURE_RESPONSE: JSON { "error": "<string>" }  e.g. "Captcha is wrong."
  ACTION: return runId as the trackingHandle string
  USAGE_IN_CODE: call inside submit() after ensureLoggedIn()

SOURCE_ENCODING:
  source = Buffer.from(encodeURIComponent(sourceCode)).toString('base64')
  REASON: vjudge rejects plain source; double-encoding is required

PROBLEM_CODE_FORMAT:
  externalProblemCode stores "<contestId>/<problemNum>" e.g. "563012/A"
  Parse: const [contestId, problemNum] = mapping.externalProblemCode.split('/')
  HOW_TO_GET: open https://vjudge.net/problem/<OJ>-<probNum> e.g. /problem/CF-1879A
              page contains a <textarea> with JSON that includes the contest mapping

---

ENDPOINT[4] POLL_VERDICT
  METHOD: GET
  URL: https://vjudge.net/solution/data/<runId>
  HEADERS:
    Cookie: <account.sessionCookie>
  RESPONSE_SHAPE:
    {
      "runId":         <number>,
      "status":        <string>,   human-readable verdict e.g. "Accepted"
      "statusType":    <number>,   0 = passed, 1 = failed/error
      "processing":    <boolean>,  true = still judging, false = terminal
      "time":          <number>,   execution time in ms
      "memory":        <number>,   memory used in KB
      "additionalInfo":<string>    compiler log / runtime error (HTML string)
    }
  TERMINAL_CONDITION: processing === false
  ACTION: poll in a loop until processing is false, then map status to VerdictStatus
  USAGE_IN_CODE: call inside getVerdict() on every poll tick

---

STATUS_MAP (vjudge status string -> your VerdictStatus enum)
  "Accepted"              -> VerdictStatus.ACCEPTED
  "Wrong Answer"          -> VerdictStatus.WRONG_ANSWER
  "Time Limit Exceeded"   -> VerdictStatus.TIME_LIMIT_EXCEEDED
  "Memory Limit Exceeded" -> VerdictStatus.MEMORY_LIMIT_EXCEEDED
  "Runtime Error"         -> VerdictStatus.RUNTIME_ERROR
  "Compilation Error"     -> VerdictStatus.COMPILATION_ERROR
  "Presentation Error"    -> VerdictStatus.PRESENTATION_ERROR
  "Output Limit Exceeded" -> VerdictStatus.OUTPUT_LIMIT_EXCEEDED
  processing === true     -> VerdictStatus.RUNNING  (any non-terminal poll)

---

LANGUAGE_MAP (SupportedLanguage enum -> vjudge language string)
  CPP17       -> "GNU G++17"
  CPP20       -> "GNU G++20"
  JAVA        -> "Java"
  PYTHON3     -> "Python3"
  JAVASCRIPT  -> "Node.js"
  GO          -> "Go"
  RUST        -> "Rust"
  KOTLIN      -> "Kotlin"
  NOTE: send the string exactly as shown; vjudge is case/space sensitive

---

CAPTCHA_ENDPOINT (only if submit returns error "Captcha is wrong.")
  METHOD: GET
  URL: https://vjudge.net/util/captcha?<Date.now()>
  HEADERS:
    Cookie: <account.sessionCookie>
  RESPONSE: binary image data
  NOTE: cannot be solved programmatically; best avoided by keeping
        submission rate low and using account pool rotation (already handled
        by VjudgeAccountPool). If triggered, quarantine the account.

---

FULL_FLOW (order of operations for one submission)
  STEP 1: ensureLoggedIn(account)
            -> POST checkLogInStatus; if false POST login; store cookie
  STEP 2: parse externalProblemCode -> [contestId, problemNum]
  STEP 3: encode source = Buffer.from(encodeURIComponent(code)).toString('base64')
  STEP 4: POST /contest/submit/<contestId>/<problemNum> with all body fields
  STEP 5: read runId from response JSON; return as trackingHandle
  STEP 6: loop every ~1500ms:
            GET /solution/data/<runId>
            if processing === false: map status -> VerdictStatus, return JudgeResult
            else: publish VerdictStatus.RUNNING intermediate result, sleep, retry
  STEP 7: release account back to pool (pool.releaseHealthy / pool.releaseUnhealthy)
