import bcrypt


def hash_password(password: str):
    if not password:
        raise ValueError("Password cannot be empty")

    raw = password.encode("utf-8")
    print(f"hash_password called; raw_bytes={len(raw)}")
    if len(raw) > 72:
        print("trimming password to 72 bytes before hashing")
        raw = raw[:72]
    hashed = bcrypt.hashpw(raw, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password, hashed_password):
    raw = plain_password.encode("utf-8")
    if len(raw) > 72:
        raw = raw[:72]
    return bcrypt.checkpw(raw, hashed_password.encode("utf-8"))
