import requests
from urllib.parse import urljoin


BASE = "https://panel.myownfreehost.net"
LOGIN_PATH = "/index.php"
PASSWORD = "tcjBANOAny9XwYM"

# Tries account username first, then probable panel email(s)
USER_CANDIDATES = [
    "if0_41301332",
    "sharjeelsohail85@gmail.com",
]


def check_login(user_value: str) -> None:
    s = requests.Session()
    s.headers.update(
        {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/123.0.0.0 Safari/537.36"
        }
    )

    login_url = urljoin(BASE, LOGIN_PATH)

    r1 = s.get(login_url, timeout=30)
    print("\n=== TRY USER:", user_value, "===")
    print("GET login status:", r1.status_code)
    print("GET login final URL:", r1.url)

    payload = {
        "uname": user_value,
        "passwd": PASSWORD,
        "role": "administrator",
        "submit": "Login",
    }

    r2 = s.post(login_url, data=payload, timeout=30, allow_redirects=True)
    print("POST login status:", r2.status_code)
    print("POST login final URL:", r2.url)

    text = r2.text.lower()
    markers = [
        "logout",
        "database",
        "mysql",
        "cpanel",
        "error #",
        "you are not logged",
        "illegal characters",
        "invalid",
        "incorrect",
    ]
    for m in markers:
        print(f"contains '{m}':", m in text)

    out_name = f".tmp-if-post-login-{user_value.replace('@', '_at_').replace('.', '_')}.html"
    with open(out_name, "w", encoding="utf-8", errors="ignore") as f:
        f.write(r2.text)
    print("saved html to", out_name)

    print("cookies:")
    for c in s.cookies:
        print(" ", c.name, c.value[:50])


def main() -> None:
    for candidate in USER_CANDIDATES:
        check_login(candidate)


if __name__ == "__main__":
    main()
