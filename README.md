# library-management
Welcome to my little library management REST API project created as part of Ragam'25 tech team induction process :)

# Description 

As the name suggests this web service deals with the basics of library management. The features include CRUD operations on Books and Users. It also includes role-based access control (RBAC) through JWT authentication and uses bcryptjs for password hashing. Data is stored in MongoDB. The whole project has been implemented in NodeJS.

The application has been hosted on Render !! : https://library-management-nn4a.onrender.com/

# Important Notes 

So the authentication involved is basic. There are three main roles. User, Librarian and Admin. User has the permission to only search books. Librarian can perform CRUD on the Books database. Admins can perform CRUD on both Books and the User Database!

Before doing any operation one must obtain a JWT token from the /login endpoint and add it to the header in this format - Authorization: Bearer <your_token_here>

One is allowed to create a user with user or librarian authentication for testing purpose, however admin role can only be given by other admins (by using update role feature).

While creating a new book please note that the following is the format :
    {
        "bid": 12345,
        "title": "test",
        "author": "John Doe",
        "published_year": 2021,
        "genre": "Mystery",
        "available_copies": 5
    }
All the fields are compulsory and BID must be unique.

While creating a new user please note that the following is the format :
    {
        "uid": 3,
        "name": "John Doe John",
        "password" : "test123",
        "email": "Jd@goofy.com",
        "membership": "Premium",
        "role": "user"
    }
In which Membership and Role are optional and will default to the values of Regular and User. UID must be unique. Another field called registered_date will be automatically added on creating and a timestamp will be added.

While doing Update queries (PUT) only the fields to be modified to be added to the request body. However BID and UID cannot be updated as they are the primary identification method.

# Endpoints

Books GET : https://library-management-nn4a.onrender.com/books

Books GET with ID : https://library-management-nn4a.onrender.com/{bid number}

Books Create (POST) : https://library-management-nn4a.onrender.com/books

Books Edit (PUT) : https://library-management-nn4a.onrender.com/books/{bid of book to be updated}

Books Delete : https://library-management-nn4a.onrender.com/books/{bid of book to be deleted}

User Login : https://library-management-nn4a.onrender.com/auth/login

User Creation (POST) : https://library-management-nn4a.onrender.com/auth/users

User GET : https://library-management-nn4a.onrender.com/auth/users

User GET with ID : https://library-management-nn4a.onrender.com/auth/users/{uid of user to be found}

User Delete : https://library-management-nn4a.onrender.com/auth/users/{uid of user to be deleted}

User Edit (PUT) : https://library-management-nn4a.onrender.com/auth/users/{uid of user to be updated}

# Outro

Thanks for going through my small project. If you find any glitches kindly let me know.
XOXO