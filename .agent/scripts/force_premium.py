
import firebase_admin
from firebase_admin import credentials, firestore
import datetime

# Initialize Firebase
if not firebase_admin._apps:
    try:
        # Try default credential (assuming gcloud auth is set up)
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            'projectId': 'horamed-firebase',
        })
    except Exception as e:
        print(f"Auth Error: {e}")
        print("Please run: gcloud auth application-default login")
        exit(1)

db = firestore.client()

email = "leplonghi@gmail.com"
print(f"Searching for user: {email}...")

# Query for the user
users_ref = db.collection('users')
query = users_ref.where('email', '==', email).limit(1)
results = query.stream()

found = False
for user_doc in results:
    found = True
    uid = user_doc.id
    print(f"Found user {uid}. Updating to Premium...")
    
    # 1. Update User Doc
    user_doc.reference.update({
        'isPremium': True,
        'stripeCustomerId': 'cus_TtqiLxTXDd0SD8' 
    })
    
    # 2. Update Subscription Doc
    sub_ref = user_doc.reference.collection('subscription').document('current')
    sub_ref.set({
        'status': 'active',
        'planType': 'premium', 
        'stripeSubscriptionId': 'sub_manual_fix_' + datetime.datetime.now().strftime("%Y%m%d"),
        'stripeCustomerId': 'cus_TtqiLxTXDd0SD8',
        'updatedAt': firestore.SERVER_TIMESTAMP
    }, merge=True)
    
    print("✅ SUCCESS: User is now Premium!")

if not found:
    print("User not found!")
