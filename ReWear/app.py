from flask import Flask, render_template, jsonify, request, session
import random, string, datetime

app = Flask(__name__)
app.secret_key = "rewear_secret_2024"

# ─── Product Catalogue ────────────────────────────────────────
PRODUCTS = [
    {
        "id": 1, "name": "Vintage Leather Jacket", "category": "outerwear",
        "price": 1899, "original": 4500, "condition": "good",
        "image":  "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80",
        "description": "A classic 90s brown leather  jacket with minimal wear. Butter-soft leather, silver hardware, two chest pockets. A timeless wardrobe staple.",
        "tags": ["90s", "Leather", "Unisex", "Brown"], "size": "M/L", "stock": 1
    },
    {
        "id": 2, "name": "Retro Zip Hoodie", "category": "tops",
        "price": 799, "original": 1800, "condition": "new",
        "image": "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=600&q=80",
        "description": "Thick cotton-blend hoodie in army olive. Full zip front, kangaroo pocket, barely worn. Cozy, oversized, and effortlessly cool.",
        "tags": ["Olive", "Oversized", "Cotton", "Casual"], "size": "L", "stock": 2
    },
    {
        "id": 3, "name": "High-Rise Denim Jeans", "category": "bottoms",
        "price": 950, "original": 2200, "condition": "good",
        "image": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80",
        "description": "Straight-leg high-rise jeans in medium wash. Light distressing at knees, very on-trend. A vintage denim piece you'll reach for every week.",
        "tags": ["Denim", "High Rise", "Blue", "Vintage"], "size": "28", "stock": 1
    },
    {
        "id": 4, "name": "Graphic Band Tee", "category": "tops",
        "price": 399, "original": 900, "condition": "fair",
        "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
        "description": "Vintage band tee with that perfect worn-in feel. Faded graphic print, crew neck, slightly cropped fit. The kind of tee you can't find in stores.",
        "tags": ["Graphic", "Cropped", "Faded", "Retro"], "size": "S", "stock": 3
    },
    {
        "id": 5, "name": "Corduroy Blazer", "category": "outerwear",
        "price": 1499, "original": 3500, "condition": "new",
        "image": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80",
        "description": "Rich caramel corduroy blazer with structured shoulders and a two-button front. Versatile enough for casual days and smart-casual evenings.",
        "tags": ["Corduroy", "Caramel", "Structured", "Smart"], "size": "M", "stock": 1
    },
    {
        "id": 6, "name": "Pleated Midi Skirt", "category": "bottoms",
        "price": 649, "original": 1500, "condition": "new",
        "image": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80",
        "description": "Flowy chiffon pleated midi skirt in dusty rose. Elastic waistband for all-day comfort. Perfect layered with a turtleneck or tucked blouse.",
        "tags": ["Pleated", "Midi", "Chiffon", "Pink"], "size": "S/M", "stock": 2
    },
    {
        "id": 7, "name": "Woven Bucket Hat", "category": "accessories",
        "price": 299, "original": 700, "condition": "good",
        "image": "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600&q=80",
        "description": "Neutral tan woven bucket hat. Breathable natural weave, wide brim, one size fits most. A rare, stylish thrift find for sunny days.",
        "tags": ["Summer", "Tan", "Woven", "Unisex"], "size": "One Size", "stock": 4
    },
    {
        "id": 8, "name": "Oversized Flannel Shirt", "category": "tops",
        "price": 549, "original": 1300, "condition": "good",
        "image": "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&q=80",
        "description": "Classic red and black flannel shirt in a relaxed, oversized fit. Wear it open as a layer or buttoned up. The ultimate grunge-casual staple.",
        "tags": ["Flannel", "Oversized", "Plaid", "Red"], "size": "L/XL", "stock": 2
    },
    {
        "id": 9, "name": "Linen Wide-Leg Trousers", "category": "bottoms",
        "price": 849, "original": 2000, "condition": "new",
        "image": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80",
        "description": "Breezy off-white linen trousers with a wide-leg cut. High waistband with side pockets. Minimal and effortlessly chic — barely worn.",
        "tags": ["Linen", "Wide Leg", "White", "Minimal"], "size": "S/M", "stock": 1
    },
    {
        "id": 10, "name": "Vintage Sunglasses", "category": "accessories",
        "price": 249, "original": 600, "condition": "good",
        "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8eATnf9EsJIsFs5an4X2sECKywtvMV8E85Q&s",
        "description": "Round tortoiseshell vintage sunglasses with UV400 lenses. Minor surface scratches on frame only, lenses crystal clear. One size.",
        "tags": ["Round", "Tortoise", "UV400", "Retro"], "size": "One Size", "stock": 2
    },
    {
        "id": 11, "name": "Knit Turtleneck Sweater", "category": "tops",
        "price": 699, "original": 1600, "condition": "new",
        "image": "https://houseofokara.com/cdn/shop/products/product-image-1114109210_790x.jpg?v=1573416723",
        "description": "Soft ribbed turtleneck in warm camel. Slim fit with cuffs and hem band. Barely worn — pulled from a capsule wardrobe cleanout.",
        "tags": ["Knit", "Camel", "Ribbed", "Cozy"], "size": "M", "stock": 3
    },
    {
        "id": 12, "name": "Canvas Tote Bag", "category": "accessories",
        "price": 199, "original": 450, "condition": "new",
        "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
        "description": "Heavy-duty natural canvas tote with interior pocket. Fits a 15\" laptop. Minimal faded logo print. The ideal sustainable everyday carry.",
        "tags": ["Canvas", "Natural", "Everyday", "Unisex"], "size": "One Size", "stock": 5
    },
]

# ─── Coupon Codes ─────────────────────────────────────────────
COUPONS = {
    "REWEAR10": {"type": "percent", "value": 10, "label": "10% off"},
    "FIRST50":  {"type": "flat",    "value": 50, "label": "₹50 off"},
    "THRIFT20": {"type": "percent", "value": 20, "label": "20% off"},
}

# ─── Helpers ──────────────────────────────────────────────────
def get_cart():    return session.get("cart", [])
def save_cart(c):  session["cart"] = c; session.modified = True
def get_wishlist(): return session.get("wishlist", [])
def save_wishlist(w): session["wishlist"] = w; session.modified = True
def get_orders():   return session.get("orders", [])
def save_orders(o): session["orders"] = o; session.modified = True

def cart_totals(cart, coupon_code=None):
    items = []
    for item in cart:
        p = next((x for x in PRODUCTS if x["id"] == item["id"]), None)
        if p:
            items.append({**p, "qty": item["qty"]})
    subtotal = sum(i["price"] * i["qty"] for i in items)
    shipping  = 0 if subtotal >= 1500 else (49 if subtotal > 0 else 0)
    discount  = 0
    coupon    = COUPONS.get((coupon_code or "").upper())
    if coupon and subtotal > 0:
        if coupon["type"] == "percent":
            discount = round(subtotal * coupon["value"] / 100)
        else:
            discount = min(coupon["value"], subtotal)
    total = max(0, subtotal - discount + shipping)
    return items, subtotal, shipping, discount, total

# ─── Routes ───────────────────────────────────────────────────
@app.route("/")
def home():
    return render_template("index.html")



# Products
@app.route("/api/products")
def api_products():
    cat     = request.args.get("category", "all")
    q       = request.args.get("q", "").strip().lower()
    sort    = request.args.get("sort", "default")
    results = PRODUCTS if cat == "all" else [p for p in PRODUCTS if p["category"] == cat]
    if q:
        results = [p for p in results if q in p["name"].lower()
                   or q in p["description"].lower()
                   or any(q in t.lower() for t in p["tags"])]
    if sort == "price_asc":   results = sorted(results, key=lambda p: p["price"])
    elif sort == "price_desc": results = sorted(results, key=lambda p: -p["price"])
    elif sort == "savings":    results = sorted(results, key=lambda p: -(p["original"]-p["price"]))
    elif sort == "newest":     results = sorted(results, key=lambda p: -p["id"])
    return jsonify(results)

@app.route("/api/product/<int:pid>")
def api_product(pid):
    p = next((x for x in PRODUCTS if x["id"] == pid), None)
    if not p: return jsonify({"error": "Not found"}), 404
    related = [x for x in PRODUCTS if x["category"] == p["category"] and x["id"] != pid][:3]
    return jsonify({**p, "related": related})

# Cart
@app.route("/api/cart", methods=["GET"])
def api_cart_get():
    coupon = session.get("coupon")
    items, sub, ship, disc, total = cart_totals(get_cart(), coupon)
    return jsonify({
        "items": items, "subtotal": sub, "shipping": ship,
        "discount": disc, "total": total,
        "coupon": coupon,
        "count": sum(i["qty"] for i in items)
    })

@app.route("/api/cart/add", methods=["POST"])
def api_cart_add():
    pid  = request.json.get("id")
    cart = get_cart()
    for item in cart:
        if item["id"] == pid:
            item["qty"] += 1
            save_cart(cart)
            return jsonify({"success": True, "count": sum(i["qty"] for i in cart)})
    cart.append({"id": pid, "qty": 1})
    save_cart(cart)
    return jsonify({"success": True, "count": sum(i["qty"] for i in cart)})

@app.route("/api/cart/update", methods=["POST"])
def api_cart_update():
    pid   = request.json.get("id")
    delta = request.json.get("delta", 0)
    cart  = get_cart()
    for item in cart:
        if item["id"] == pid:
            item["qty"] = max(0, item["qty"] + delta)
            if item["qty"] == 0:
                cart = [i for i in cart if i["id"] != pid]
            break
    save_cart(cart)
    return jsonify({"success": True, "count": sum(i["qty"] for i in cart)})

@app.route("/api/cart/remove", methods=["POST"])
def api_cart_remove():
    pid  = request.json.get("id")
    cart = [i for i in get_cart() if i["id"] != pid]
    save_cart(cart)
    return jsonify({"success": True, "count": sum(i["qty"] for i in cart)})

# Coupon
@app.route("/api/coupon/apply", methods=["POST"])
def api_coupon_apply():
    code = request.json.get("code", "").strip().upper()
    if code in COUPONS:
        session["coupon"] = code
        session.modified = True
        return jsonify({"success": True, "label": COUPONS[code]["label"], "code": code})
    return jsonify({"success": False, "message": "Invalid coupon code"}), 400

@app.route("/api/coupon/remove", methods=["POST"])
def api_coupon_remove():
    session.pop("coupon", None)
    session.modified = True
    return jsonify({"success": True})

# Wishlist
@app.route("/api/wishlist", methods=["GET"])
def api_wishlist_get():
    ids = get_wishlist()
    items = [p for p in PRODUCTS if p["id"] in ids]
    return jsonify({"items": items, "ids": ids})

@app.route("/api/wishlist/toggle", methods=["POST"])
def api_wishlist_toggle():
    pid  = request.json.get("id")
    wl   = get_wishlist()
    if pid in wl:
        wl.remove(pid)
        added = False
    else:
        wl.append(pid)
        added = True
    save_wishlist(wl)
    return jsonify({"success": True, "added": added, "count": len(wl)})

# Orders
@app.route("/api/order", methods=["POST"])
def api_order():
    data    = request.json
    name    = data.get("name", "").strip()
    phone   = data.get("phone", "").strip()
    address = data.get("address", "").strip()
    if not name or not phone or not address:
        return jsonify({"success": False, "message": "Please fill all required fields"}), 400
    cart = get_cart()
    if not cart:
        return jsonify({"success": False, "message": "Your cart is empty"}), 400

    coupon = session.get("coupon")
    items, sub, ship, disc, total = cart_totals(cart, coupon)

    order_id = "RW" + "".join(random.choices(string.digits, k=6))
    order = {
        "id":        order_id,
        "date":      datetime.datetime.now().strftime("%d %b %Y, %I:%M %p"),
        "name":      name,
        "phone":     phone,
        "address":   address,
        "payment":   data.get("payment", "cod"),
        "items":     [{"id": i["id"], "name": i["name"], "image": i["image"],
                       "price": i["price"], "qty": i["qty"]} for i in items],
        "subtotal":  sub,
        "shipping":  ship,
        "discount":  disc,
        "total":     total,
        "coupon":    coupon,
        "status":    "Confirmed"
    }
    orders = get_orders()
    orders.insert(0, order)
    save_orders(orders)
    save_cart([])
    session.pop("coupon", None)
    session.modified = True
    return jsonify({"success": True, "order_id": order_id, "name": name, "total": total})

@app.route("/api/orders", methods=["GET"])
def api_orders():
    return jsonify(get_orders())

if __name__ == "__main__":
    app.run(debug=True, port=5000)