# backend/app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from app.database import get_db
from app import schemas, models
from passlib.context import CryptContext

router = APIRouter(prefix="/auth", tags=["authentication"])

# JWT Configuration
SECRET_KEY = "fitgoalz-secret-key-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Password verification
def verify_password(plain_password: str, hashed_password: str) -> bool:
    print(f"🔐 VERIFY_PASSWORD CALLED")
    print(f"   Plain password: {plain_password}")
    print(f"   Hashed password: {hashed_password}")
    
    if not plain_password or not hashed_password:
        print("❌ Missing password or hash")
        return False
    
    try:
        result = pwd_context.verify(plain_password, hashed_password)
        print(f"✅ Password verification result: {result}")
        return result
    except Exception as e:
        print(f"❌ Password verification error: {str(e)}")
        return False

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
):
    print(f"🔍 DEBUG get_current_user called")
    print(f"🔍 DEBUG Token received: {token}")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )
    
    if not token or token == "null" or token == "undefined":
        print("🔍 DEBUG: No token provided or token is null/undefined")
        raise credentials_exception
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        print(f"🔍 DEBUG Token payload email: {email}")
        
        if email is None:
            raise credentials_exception
            
    except JWTError as e:
        print(f"🔍 DEBUG JWT Error: {e}")
        raise credentials_exception
    
    user = get_user_by_email(db, email=email)
    if user is None:
        print(f"🔍 DEBUG User not found for email: {email}")
        raise credentials_exception
        
    print(f"🔍 DEBUG Authentication successful for user: {user.email}")
    return user

# Registration endpoint
@router.post("/register", response_model=schemas.User)
async def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    print("=== 🔍 REGISTRATION DEBUG START ===")
    print(f"📧 Registering user: {user.email}")
    print(f"👤 Username: {user.username}")
    print(f"🔑 Plain password: {user.password}")
    
    # Check if user exists
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        print("❌ USER ALREADY EXISTS")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password and create user
    hashed_password = get_password_hash(user.password)
    print(f"🔐 Hashed password: {hashed_password}")
    
    db_user = models.User(
        email=user.email,
        username=user.username,
        password_hash=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    print("✅ REGISTRATION SUCCESSFUL")
    print("=== 🔍 REGISTRATION DEBUG END ===")
    return db_user

# Login endpoint
@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    print("=== 🔍 LOGIN DEBUG START ===")
    print(f"📧 Username received: {form_data.username}")
    print(f"🔑 Password received: {form_data.password}")
    
    user = get_user_by_email(db, form_data.username)
    if not user:
        print("❌ USER NOT FOUND IN DATABASE")
        print("=== 🔍 LOGIN DEBUG END ===")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    print(f"✅ User found in database: {user.email}")
    print(f"🔐 Stored password hash: {user.password_hash}")
    
    # Debug password verification
    print("🔍 Verifying password...")
    password_correct = pwd_context.verify(form_data.password, user.password_hash)
    print(f"🔍 Password verification result: {password_correct}")
    
    if not password_correct:
        print("❌ PASSWORD VERIFICATION FAILED")
        print("=== 🔍 LOGIN DEBUG END ===")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    print("🎉 LOGIN SUCCESSFUL - Password matches!")
    print("=== 🔍 LOGIN DEBUG END ===")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer", 
        "user_id": user.id,
        "email": user.email
    }

# Protected endpoint - get current user
@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# Simple token test endpoint
@router.get("/test-token-simple")
async def test_token_simple(
    token: str,
    db: Session = Depends(get_db)
):
    """Test endpoint that accepts token as query parameter"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user = get_user_by_email(db, email=email)
        return {
            "success": True,
            "message": "Token is valid!",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username
            }
        }
    except JWTError as e:
        return {"success": False, "error": str(e)}

# Debug headers endpoint
@router.get("/debug-headers")
async def debug_headers(request: Request):
    """Debug endpoint to see what headers are received"""
    headers = dict(request.headers)
    return {
        "headers_received": headers,
        "authorization_header": request.headers.get("authorization"),
        "content_type": request.headers.get("content-type")
    }

# Test endpoints
@router.get("/test-public")
async def test_public():
    return {"message": "This is a public endpoint - no auth needed"}

@router.get("/test-protected")
async def test_protected(current_user: models.User = Depends(get_current_user)):
    return {
        "message": "This is a protected endpoint", 
        "user": current_user.email,
        "user_id": current_user.id

    }

@router.get("/debug/users")
async def debug_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return {
        "users": [
            {
                "id": u.id, 
                "email": u.email, 
                "password_hash": u.password_hash,
                "created_at": u.created_at
            } 
            for u in users
        ]
    }