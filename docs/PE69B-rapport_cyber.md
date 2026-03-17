## PE69B – Security review of `novlearn.fr` (based on ZAP report)

Date of scan: **2026‑03‑17**  
Scope: **[https://novlearn.fr/](https://novlearn.fr/)** (Next.js frontend + Supabase/FastAPI backend behind reverse proxy)

---

### 1. Executive summary

- **No critical business‑logic or data‑exfiltration flaws** were identified in the ZAP report.  
- The **single “High” alert (Source Code Disclosure / File Inclusion)** is a **false positive** on the Next.js image optimisation endpoint and does **not** expose source code.  
- The **real findings** are mostly **missing or weak HTTP security headers** (CSP, HSTS, clickjacking, X‑Content‑Type‑Options, Permissions‑Policy, COEP/COOP/CORP, server banners, proxy disclosure). These are **infrastructure / configuration issues**, not application‑code vulnerabilities.  
- A “Big Redirect Detected” alert on `/classement` is **very low impact**: it only redirects anonymous users to `/auth/login` and does not leak sensitive information.  
- Some informational findings (modern web app, user agent fuzzer, cache hints) are **not vulnerabilities**; they only describe behaviour or the fact that the site was scanned.

**Priority 1 – to fix soon (real security value):**

- Set **Content‑Security‑Policy**, **X‑Frame‑Options / `frame-ancestors`**, **Strict‑Transport‑Security**, **X‑Content‑Type‑Options**, and **Permissions‑Policy** at the reverse proxy / app level.  
- Remove or minimise **technology/version banners** (`X‑Powered‑By`, `Server`) and avoid leaking reverse‑proxy details.

**Priority 2 – nice‑to‑have / tuning:**

- Consider **COOP/COEP/CORP** for isolation and future browser features, but only after testing for breakage.  
- Review cache‑control hints according to performance vs. privacy trade‑offs.

---

### 2. Methodology and code review scope

- **Report source**: `docs/PE69B-rapport_cyber.html` – automated ZAP scan.  
- **Code inspected (relevant to the findings)**:
  - `frontend/next.config.mjs` – rewrites and Next.js config, no custom headers defined.  
  - `frontend/app/layout.tsx` – global HTML `<head>` and third‑party resources (KaTeX, Google Analytics).  
  - `frontend/middleware.ts` – Supabase auth middleware and route protection logic.  
  - `frontend/app/classement/page.tsx` – leaderboard page that triggers the “Big Redirect” alert.  
  - `frontend/app/components/Logo.tsx` – use of `next/image` on `/logo_seul.png`.  
  - Grep across the repo for security headers (`Content‑Security‑Policy`, `X‑Frame‑Options`, `Strict‑Transport‑Security`, `Permissions‑Policy`) and for `_next/image`.

No backend FastAPI endpoint was directly referenced by ZAP in this scan; all concrete URLs in the alert details are frontend or reverse‑proxy responses.

---

### 3. Summary of findings and re‑assessment

Legend for **Real impact**:

- **High** – must be fixed quickly; real risk of compromise or data exposure.
- **Medium** – important hardening for a production app with personal data.  
- **Low** – limited risk, mostly information disclosure or best practice.  
- **None / False positive** – not exploitable in the current architecture.


| ZAP plugin / name                                                     | ZAP risk | Our assessment                       | Comment                                                                                  |
| --------------------------------------------------------------------- | -------- | ------------------------------------ | ---------------------------------------------------------------------------------------- |
| 43 – Source Code Disclosure – File Inclusion (`/_next/image?url=...`) | High     | **None – False positive**            | Next.js image optimiser; no arbitrary file read or source disclosure observed.           |
| 10038 – Content‑Security‑Policy Header Not Set                        | Medium   | **Medium – important hardening**     | Should be added at reverse proxy / app; protects against XSS and some injections.        |
| 10020 – Missing Anti‑clickjacking Header                              | Medium   | **Medium – important hardening**     | Add `X‑Frame‑Options: DENY` or CSP `frame-ancestors 'none'`.                             |
| 40025 – Proxy Disclosure                                              | Medium   | **Low–Medium – configuration leak**  | Reverse‑proxy details exposed; mainly aids attackers in reconnaissance.                  |
| 90003 – Subresource Integrity Attribute Missing                       | Medium   | **Low – acceptable on trusted CDNs** | KaTeX uses SRI; GA script from Google does not. Common/acceptable trade‑off.             |
| 10044 – Big Redirect Detected (`/classement` → `/auth/login`)         | Low      | **Very Low / likely benign**         | Redirect to login with normal page body only; no extra sensitive info.                   |
| 90004 – COEP/COOP/CORP Headers Missing or Invalid                     | Low      | **Low – optional isolation**         | Security hardening for cross‑origin isolation; add later after testing compatibility.    |
| 10009 – In Page Banner Information Leak                               | Low      | **Low – review but likely benign**   | Likely generic info (framework, environment); ensure no secrets/stack traces in banners. |
| 10063 – Permissions‑Policy Header Not Set                             | Low      | **Medium – good hardening**          | Use to restrict access to camera, microphone, geolocation, etc.                          |
| 10037 – `X‑Powered‑By` header leaks technology info                   | Low      | **Low–Medium – fingerprinting**      | Disable header in Next.js and backend; reduces recon value.                              |
| 10036 – `Server` header leaks web server / version                    | Low      | **Low–Medium – fingerprinting**      | Configure reverse proxy to hide exact server/version.                                    |
| 10035 – Strict‑Transport‑Security Header Not Set                      | Low      | **Medium – important for HTTPS**     | Should be set for production domains (`includeSubDomains`, `preload` later).             |
| 10021 – X‑Content‑Type‑Options Header Missing                         | Low      | **Medium – easy, valuable fix**      | Add `nosniff` to reduce MIME sniffing attacks.                                           |
| 10109 – Modern Web Application                                        | Info     | **None – purely informational**      | Only says the site is a modern web app.                                                  |
| 10049 – Non‑storable Content                                          | Info     | **None – behaviour description**     | Indicates some responses are non‑cacheable.                                              |
| 10015 – Re‑examine Cache‑Control Directives                           | Info     | **Low – tuning**                     | Review cache strategy vs. privacy; not a direct vuln.                                    |
| 10049 – Storable and Cacheable Content                                | Info     | **Low – tuning**                     | Ensure no sensitive data is cached publicly.                                             |
| 10104 – User Agent Fuzzer                                             | Info     | **None – scanner artefact**          | Alert only reflects that fuzzing occurred.                                               |


---

### 4. Detailed analysis by finding

#### 4.1 Source Code Disclosure – File Inclusion (`/_next/image`)

- **ZAP details**  
  - URL: `https://novlearn.fr/_next/image?q=75&url=%2Flogo_seul.png&w=128`  
  - Node: `https://novlearn.fr/_next/image (q,url,w)`  
  - Parameter: `url`  
  - Attack sample: `/image`  
  - Heuristic: response for `/image` differs from random parameter by 26% (below 75% threshold).
- **What this endpoint really is**  
  - The app uses `next/image` in `Logo.tsx`:
    - `src="/logo_seul.png"` (image stored in `public/`).
  - The route `/_next/image` is a **built‑in Next.js image optimisation endpoint**, not custom code.  
  - The `url` parameter is controlled by Next.js and restricted to allowed paths/domains; it is **not interpreted as a raw filesystem path**.
- **Code / config review**  
  - `frontend/next.config.mjs` does **not** define any custom image loader or unsafe rewrites; `_next/image` behaviour is default.  
  - `frontend/middleware.ts` explicitly excludes `/_next/image` from auth middleware and does **not** add any custom logic there.  
  - No custom route or backend endpoint named `/image` was found in the codebase.
- **Risk assessment**  
  - ZAP’s plugin is designed for generic file‑inclusion endpoints; here it misclassifies a standard Next.js optimiser.  
  - There is **no evidence of arbitrary file read** or source code disclosure; responses are normal image responses or error pages.  
  - **Conclusion**: **False positive** in this context.
- **Recommendations**  
  - Optionally harden Next.js image config:
    - Explicit `images: { domains: [...], remotePatterns: [...] }` to restrict remote sources.
  - Keep Next.js patched, since any future vulnerability in `_next/image` would be inherited.  
  - No urgent code change is required specifically for this ZAP alert.

##### 4.1.1 Deep‑dive: could this really be a path traversal?

**What a real path traversal / file inclusion would look like**

In a true path traversal, an attacker can pass values such as:

- `/download?file=../../../../etc/passwd`  
- `/page?template=../../../../var/www/app/settings.py`  
- Or encoded variants: `..%2f..%2fetc%2fpasswd`, `%2e%2e%2f%2e%2e%2fconfig.yml`

and the application will **return the raw contents** of those files (system files, backend code, configs, secrets, etc.).  
On `novlearn.fr`, a real problem on this endpoint would mean that URLs like:

- `https://novlearn.fr/_next/image?q=75&url=../../../../etc/passwd&w=128`  
- `https://novlearn.fr/_next/image?q=75&url=../../../../var/www/html/backend/main.py&w=128`

return the content of those files in the HTTP response body.

**What ZAP actually observed here**

- ZAP tried to use `url=/image` and compared the response to a response with a random parameter value.  
- It reports a **26 % difference**, while its own threshold to consider the output as likely source code is **75 %**.  
- The **Evidence** field in the report is empty: no snippet of leaked code, no system file, no directory listing is shown.

In other words, ZAP has flagged a *potential* file‑inclusion vector, but it has **not demonstrated any actual file disclosure**.

**What this endpoint really is in this application**

- `/_next/image` is the standard **Next.js image optimisation** endpoint.  
- `Logo.tsx` uses it via `next/image` with `src="/logo_seul.png"` (a static file in `public/`).  
- `next.config.mjs` does not define any custom image loader or rewrite that would repurpose `_next/image` as a generic file reader.  
- `middleware.ts` does not intercept or alter `_next/image`.  
- A grep over the codebase shows **no place** where a request parameter is concatenated into a filesystem path and passed to `open()` / `readFile` etc.

So, within the code we have, there is **no implementation of a path traversal or file inclusion** attached to this endpoint.

**Could someone really have seen “all files of the site” and the source code?**

It is completely normal that anyone can:

- Download and inspect all **frontend bundles** (`/_next/static/...`) via the browser DevTools.  
- See all static assets in `public/` (logo, icons, etc.).  
- Infer routes and API endpoints from HTML/JS.

That is **not** a vulnerability; it is how any React/Next.js application works.  
To truly “see all files”, an attacker would need to show that they can read, for example:

- `backend/main.py` or other server‑side code,  
- System files such as `/etc/passwd`,  
- Or non‑public config files, via a simple HTTP GET with a crafted `url` or similar parameter.

Neither the ZAP report nor the codebase provide evidence of this.

**How to test this yourself**

To be absolutely sure, you can try (from a browser or curl, in read‑only):

- `https://novlearn.fr/_next/image?q=75&url=../../../../etc/passwd&w=128`  
- `https://novlearn.fr/_next/image?q=75&url=../../../../var/www/html/backend/main.py&w=128`  
- And the same with URL‑encoded `../` sequences.

Then inspect the HTTP responses:

- If you ever see real system file or backend source content, then there is a **critical, real path traversal** and the endpoint must be fixed or disabled immediately.  
- If you only see 400/404/500 errors, broken images, or generic pages with no internal file content, then **this High is a practical false positive on a framework endpoint**.

**Should the site be taken offline because of this specific High?**

Based on:

- The absence of any leaked file in ZAP’s evidence,  
- The fact that `_next/image` is a standard Next.js optimiser with no custom file‑loading logic in this repo,  
- And the lack of any code pattern implementing a traversal,

I do **not** consider this particular High alert to be a confirmed path traversal that exposes “all files of the site”.  
The serious issues to fix are elsewhere (missing security headers, information leakage via `Server` / `X-Powered-By` / proxy headers), and they are already covered in this report.

If, during manual testing, you ever manage to retrieve real internal files through `_next/image` or any other endpoint, the classification changes immediately to **critical**, and at that point the recommendation would be to restrict or take down the affected service until patched. With the data currently available, this is **not** what is happening here.

#### 4.2 Missing Content‑Security‑Policy (CSP)

- **ZAP details**  
  - Affects: `https://novlearn.fr/`, `https://novlearn.fr/` (with trailing slash) and image URLs.  
  - Finding: Response headers do **not** contain `Content‑Security‑Policy`.
- **Code / architecture context**  
  - `frontend/layout.tsx` defines document metadata and includes:
    - KaTeX CSS & JS from `cdn.jsdelivr.net` with **SRI** and `crossOrigin="anonymous"`.  
    - Google Analytics via `<GoogleAnalytics gaId={GA_ID} />`.
  - No CSP is defined in **Next.js config** or **app code**;  
  - Web server configuration (Apache / Nginx) is not part of this repo, so headers are currently controlled there.
- **Risk assessment**  
  - Without CSP, any future XSS bug (in code, dependencies, or third‑party scripts) is easier to exploit.  
  - Given that Novlearn processes **user identities and educational data**, a **CSP is strongly recommended**.  
  - **Real impact**: **Medium** – defence‑in‑depth but important for a public SaaS.
- **Recommended CSP approach (high‑level)**  
  - Add a **report‑only CSP first**, then enforce once validated.  
  - Example starting point (to implement at reverse proxy or via Next’s `headers()` in `next.config.mjs`):
    - `default-src 'self';`  
    - `script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com 'unsafe-inline' 'unsafe-eval';` (tighten once inline scripts are removed)  
    - `style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;`  
    - `img-src 'self' data: https://*.supabase.co https://www.google-analytics.com;`  
    - `font-src 'self' data:;`  
    - `frame-ancestors 'none';`  
    - `connect-src 'self' https://*.supabase.co https://www.google-analytics.com;`
  - Refine based on an inventory of actual external resources.

#### 4.3 Missing anti‑clickjacking protection

- **ZAP details**  
  - Plugin: 10020 – Missing Anti‑clickjacking Header.  
  - Affects multiple pages (systemic).
- **Current behaviour**  
  - No `X‑Frame‑Options` or CSP `frame-ancestors` directive is set by the app or in any visible config file.  
  - Therefore, pages may be embedded in untrusted iframes, enabling clickjacking scenarios.
- **Risk assessment**  
  - Novlearn includes **authenticated actions, scores and profiles**; framing the site by a malicious domain could be used to trick users into interacting with hidden UI.  
  - **Real impact**: **Medium** for a logged‑in learning platform.
- **Fix**  
  - At the reverse proxy (preferred) or via Next.js custom headers:
    - Set `X-Frame-Options: DENY` (simple, widely supported), or  
    - Use CSP `frame-ancestors 'none';` (more flexible; can allow specific trusted origins, e.g. if you ever embed the app in a parent domain).

#### 4.4 Proxy disclosure

- **ZAP details**  
  - Plugin: 40025 – Proxy Disclosure.  
  - “Systemic” – impacting many responses.
- **Likely cause**  
  - Headers such as `Via`, `X-Forwarded-For`, `X-Forwarded-Host`, or reverse‑proxy specific banners are present.  
  - These headers typically reveal the presence and sometimes the type/version of the proxy.
- **Risk assessment**  
  - Primarily **information disclosure** that can help an attacker tailor exploits.  
  - Does **not** directly compromise data, but is worth cleaning up for a hardened production posture.  
  - **Real impact**: **Low–Medium**.
- **Fix**  
  - Review reverse‑proxy configuration (Apache/Nginx) to:
    - Remove unnecessary `Via` or internal routing headers from responses.  
    - Keep only headers strictly required for application logic and logging.

#### 4.5 Subresource Integrity (SRI) missing

- **ZAP details**  
  - Plugin: 90003 – Sub Resource Integrity Attribute Missing.  
  - Marked as “Systemic” for external resources.
- **Code reality**  
  - `layout.tsx` already sets **SRI** for KaTeX:
    - CSS and JS include `integrity="sha384-..."` and `crossOrigin="anonymous"`.
  - Google Analytics scripts injected by `<GoogleAnalytics />` **do not use SRI** – this is expected; GA’s scripts change frequently, and GA’s own documentation does not recommend SRI.
- **Risk assessment**  
  - Missing SRI on GA is a **trade‑off** accepted by most production sites; GA is a trusted third party.  
  - Adding SRI to highly stable third‑party libraries (like KaTeX) is already done correctly.  
  - **Real impact**: **Low** in this context.
- **Fix**  
  - Keep SRI on stable CDN assets (already the case).  
  - Optionally self‑host critical JS/CSS to control hashes and reduce dependency on CDNs.  
  - Accept the lack of SRI for GA as intentional, and document this in security notes.

#### 4.6 Big Redirect Detected – `/classement` → `/auth/login`

- **ZAP details**  
  - Plugin: 10044 – Big Redirect Detected (Potential Sensitive Information Leak).  
  - URL: `https://novlearn.fr/classement`  
  - Location header: `/auth/login` (length 11).  
  - Response body length: ~9,980 bytes (full login page HTML).
- **Code behaviour**  
  - `frontend/app/classement/page.tsx`:
    - Calls `getServerUser()` (Supabase server helper).  
    - If no user: `redirect("/auth/login");`.  
    - Otherwise loads leaderboard data and renders the page.
  - `frontend/middleware.ts` does not enforce protection on `/classement` itself but **server component logic** does; unauthenticated users never see leaderboard data, they only see the login page.
- **Risk assessment**  
  - ZAP flags cases where a redirect includes a substantial body, in case that body contains sensitive data.  
  - In this case, the body is just the **public login page** that anonymous users can access anyway.  
  - No user‑specific or internal data is leaked.  
  - **Real impact**: **Very Low / benign**.
- **Optional improvements**  
  - This behaviour is typical for Next.js; changing it would bring little benefit.  
  - If desired, make auth protection **consistent** by also enforcing it at the middleware level for `/classement` (for example by adding it to a set of protected routes), purely for clarity.

#### 4.7 COEP / COOP / CORP headers missing

- **ZAP details**  
  - Plugin: 90004 – Cross‑Origin‑Embedder‑Policy / Cross‑Origin‑Opener‑Policy / Cross‑Origin‑Resource‑Policy header missing or invalid.  
  - Marked as Low and “systemic”.
- **Context**  
  - These headers are mostly relevant when you want **cross‑origin isolation**, SharedArrayBuffer, or strong protection against cross‑origin leaks.  
  - They can easily break embeds, third‑party scripts, or Supabase interactions if misconfigured.
- **Risk assessment**  
  - Good hardening for high‑security apps, but not strictly required for most SaaS use cases.  
  - **Real impact**: **Low**, but good to plan for once core headers (CSP, HSTS, etc.) are in place.
- **Fix (optional, after testing)**  
  - Example conservative configuration:
    - `Cross-Origin-Opener-Policy: same-origin`  
    - `Cross-Origin-Embedder-Policy: require-corp`  
    - `Cross-Origin-Resource-Policy: same-origin`
  - Test thoroughly with Supabase, analytics, and any embeds; roll back if compatibility issues arise.

#### 4.8 In Page Banner Information Leak

- **ZAP details**  
  - Plugin: 10009 – In Page Banner Information Leak.  
  - 4 instances detected.
- **Likely causes**  
  - Banners or messages that mention:
    - Framework names or environment information (e.g. “Next.js dev server” messages, though those should not appear in production).  
    - Potentially verbose error pages from the reverse proxy or backend.
- **Risk assessment**  
  - Disclosing **stack traces, environment names, or internal URLs** would be an issue.  
  - Disclosing only high‑level technology names is mostly recon and overlaps with the `X‑Powered‑By`/`Server` headers.  
  - Without the exact banner content in the report, we assume current risk is **Low**, but it’s worth verifying once against the production site.
- **Fix**  
  - Ensure:
    - Custom error pages don’t expose stack traces or internal file paths.  
    - Framework debug banners are disabled in production builds.  
    - Any environment‑specific hints (e.g. “staging”, “dev”) are not visible on `novlearn.fr`.

#### 4.9 Permissions‑Policy header missing

- **ZAP details**  
  - Plugin: 10063 – Permissions Policy Header Not Set (systemic).
- **Context**  
  - This header (formerly `Feature-Policy`) allows explicitly enabling/disabling browser features per origin: `geolocation`, `camera`, `microphone`, `fullscreen`, etc.  
  - Even if the app does not currently use these features, setting a restrictive baseline is good practice.
- **Risk assessment**  
  - Without this header, the app relies solely on default browser behaviour; extensions or future code might accidentally enable powerful APIs.  
  - **Real impact**: **Medium** as an easy hardening measure.
- **Fix**  
  - At the reverse proxy or via Next headers:
    - Example restrictive policy:  
    `Permissions-Policy: geolocation=(), microphone=(), camera=(), fullscreen=(self)`
  - Adjust based on actual feature usage (currently, Novlearn seems not to need camera/mic).

#### 4.10 Server and X‑Powered‑By headers

- **ZAP details**  
  - Plugin 10037 – `X-Powered-By` leaks information.  
  - Plugin 10036 – `Server` header leaks web server and version information.  
  - Both are systemic across responses.
- **Context**  
  - Next.js by default adds `X-Powered-By: Next.js` unless `poweredByHeader: false` is set in `next.config`.  
  - Reverse proxies (Apache/Nginx) add `Server: Apache/2.x (Ubuntu)` or similar, often including version.
- **Risk assessment**  
  - These headers are **not vulnerabilities by themselves**, but they make fingerprinting easier for attackers to match the stack against public exploits.  
  - **Real impact**: **Low–Medium** as information disclosure.
- **Fix**  
  - In `next.config.mjs`, add:
    - `poweredByHeader: false`
  - In Apache/Nginx, configure:
    - Generic `Server` header (e.g. `Server: Novlearn`) or hide version details entirely.
  - Re‑scan to verify the absence of these headers.

#### 4.11 Strict‑Transport‑Security (HSTS) missing

- **ZAP details**  
  - Plugin: 10035 – Strict‑Transport‑Security Header Not Set (systemic).
- **Context & risk**  
  - HSTS ensures browsers always use HTTPS for a given domain and prevents some downgrade / SSL‑stripping attacks.  
  - For `novlearn.fr`, which should only be served over HTTPS, HSTS is **strongly recommended**.  
  - **Real impact**: **Medium**.
- **Fix**  
  - At the reverse proxy, set e.g.:  
    - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - Add only once you are sure **all** subdomains are HTTPS‑only (or drop `includeSubDomains` initially).  
  - Optionally submit `novlearn.fr` to the HSTS preload list after stable operation.

#### 4.12 X‑Content‑Type‑Options missing

- **ZAP details**  
  - Plugin: 10021 – X‑Content‑Type‑Options Header Missing (systemic).
- **Context & risk**  
  - Without `X-Content-Type-Options: nosniff`, browsers may sniff MIME types and treat content differently than declared, which can contribute to XSS or content confusion attacks.  
  - This header is a **simple, safe default** for most modern apps.  
  - **Real impact**: **Medium**.
- **Fix**  
  - Set globally:  
    - `X-Content-Type-Options: nosniff`
  - Apply at the reverse proxy level for all responses (static and dynamic).

#### 4.13 Informational / tuning findings

- **10109 – Modern Web Application**  
  - Merely indicates that the app uses modern patterns (SPAs, APIs). Not a vulnerability.
- **10049 / 10015 – Cache‑control related alerts (Non‑storable, Storable and Cacheable Content, Re‑examine Cache‑control)**  
  - Reflect caching strategy on static vs. dynamic content.  
  - Ensure that:
    - Authenticated or personalised responses are not cached in shared caches (CDNs, proxies).  
    - Truly static assets (images, JS bundles) leverage long‑lived caching with fingerprinted filenames (handled by Next.js).
  - Risk is **low** as long as secrets or personalised content are not cacheable publicly.
- **10104 – User Agent Fuzzer**  
  - Only confirms that ZAP used various user agents during testing. No action required.

---

### 5. Prioritised remediation plan

**Phase 1 – Core security headers (short‑term, high value)**  

- Implement at reverse proxy (preferred) or via Next.js `headers()`:
  - `Strict-Transport-Security` (HSTS).  
  - `X-Content-Type-Options: nosniff`.  
  - Clickjacking protection: `X-Frame-Options: DENY` and/or CSP `frame-ancestors 'none'`.  
  - Baseline `Content-Security-Policy` with `default-src 'self'` and explicit script/style/img/connect sources.  
  - `Permissions-Policy` with a restrictive default.

**Phase 2 – Reduce information leakage (medium‑term)**  

- Disable `X-Powered-By` in Next.js (`poweredByHeader: false`).  
- Simplify or neutralise the `Server` header in the reverse proxy.  
- Remove or minimise any proxy‑specific headers not required by the app.

**Phase 3 – Optional isolation and polish (longer‑term)**  

- Evaluate adding COOP/COEP/CORP for cross‑origin isolation, testing with Supabase and analytics.  
- Review banner and error pages to ensure no stack traces or internal paths are ever rendered in production.  
- Re‑run ZAP to confirm:
  - High and Medium findings are gone.  
  - Low/Info findings are either resolved or explicitly accepted.

---

### 6. Conclusion

- The ZAP scan does **not** reveal any severe exploitation path such as SQL injection, authentication bypass, or direct data exfiltration.  
- The majority of issues are **missing security headers and minor information disclosure**, which are best fixed at the **infrastructure level** rather than in application code.  
- Implementing the recommended headers and hardening steps will significantly improve Novlearn’s security posture and should be documented as part of the production deployment baseline.  
- The **“Source Code Disclosure” high‑risk finding is a false positive** in the context of Next.js’s `_next/image` endpoint and does **not** require emergency code changes.

