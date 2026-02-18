import json

with open("feature_flags.json") as f:
    raw_flags = json.load(f)

flags = {flag["name"]: flag["status"] == "active" for flag in raw_flags}


# ---- UI Theme ----
def apply_theme(user: dict) -> dict:
    if flags["flag_dark_mode"]:
        user["theme"] = "dark"
        print(f"Dark mode enabled for user: {user['id']}")
    else:
        user["theme"] = "light"
        print(f"Light mode enabled for user: {user['id']}")
    return user


# ---- Checkout ----
def handle_checkout(cart: dict) -> dict:
    if flags["flag_new_checkout"]:
        print("Using new checkout flow")
        return new_checkout_flow(cart)
    else:
        print("Using legacy checkout flow")
        return legacy_checkout_flow(cart)


def new_checkout_flow(cart: dict) -> dict:
    total = sum(item["price"] for item in cart["items"])
    return {"success": True, "total": total, "flow": "new"}


def legacy_checkout_flow(cart: dict) -> dict:
    subtotal = sum(item["price"] for item in cart["items"])
    tax = subtotal * 0.08
    return {"success": True, "total": subtotal + tax, "flow": "legacy"}


# ---- API ----
def get_api_client(version: str) -> dict:
    return create_modern_api_client(version)


def create_modern_api_client(version: str) -> dict:
    return {"version": version, "base_url": "/api/v2", "legacy": False}


# ---- Dashboard ----
def render_dashboard(user: dict) -> dict:
    sections = ["overview", "reports"]

    if flags["flag_beta_dashboard"]:
        sections.extend(["analytics", "insights", "cohorts"])
        print("Beta dashboard features enabled")

    return {
        "user": user["id"],
        "sections": sections,
        "beta": True if flags["flag_beta_dashboard"] else False,
    }
