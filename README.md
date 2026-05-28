This is a Secure Job Application Tracker API built with Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis, Vault, and Docker. Milestone 1 focuses only on setting up a clean TypeScript Express API foundation.

Milestone 1:
What did I set up?
 An typescript express application, that has a dockerfile and compose file set up 
What is Express responsible for?
 It is responsible for creating a ready to go server and create apis in an unopinionated manner
What is TypeScript responsible for?
 Typescript is here to provide type saftey for the application. This means that every variable, function, return, etc have a type which makes the application much more robust and safer to use
What does Docker do here?
 Docker solves the "It works on my machine" issue every dev goes through by putting together the application in containers that cna be used by everyone (basically mimics your local environment on someone elses pc)
What is the difference between running locally and running in Docker?
    Running locally has the user use their own resources via the hosts OS while docker runs it all in a container and with the added bonus of having multiple containers running rather than having to install and external dependencies (like databases or redis). Plus whoever is running an application on docker runs it on the version the app  was created on (Ex. If app is created using Node 18, and a teammate has Node 20 installed, docker runs the app using node 18 (via the image built in the dockerfile))
What errors did I face and how did I fix them?
    A lot of the errors I faced were primarily setting up typescript and the docker files. I was very inclined to use AI to do it for me, however I went into the rabbithole of research and used AI to help me understand what I was reading during times of confusion. I managed to set it all up right at the end.

Milestone 2:
What is Prisma and what does it solve?
    Prisma is an ORM that allows developers to communicate with their database (SQL or NoSQL) without having to write native quiries (unless needed)
What is PostgreSQL responsible for?
    Postgres is responsible for storing data permenantly for later uses (the entire storing, managing and retrival)
What is the difference between Prisma schema and database tables?
    A presma schema is a blueprint for what a table should look like, essentialy the starting point of a table. A database table (once constructed from a schema) is then there to store data
What is a migration?
    A migration is a snapshot of a database at a specfic point in time. This can be things like a new table being added, additional constraints or columns being added to already existing tables or deleting a table. npx prisma migrate dev (optional --name to name the migration)
What is Prisma Client?
    Prisma Client is the generated information (via npx prisma generate) that provides you with a way to connect to a postgres database, as well as providing any needed types, interfaces and overall programtically helps run CRUD operations
What is a relation?
    A relation is a connection between tables, a table property/column having a relation tag means it is connected to another table's column either in pointing to that table or being able to show related data. 
What errors did I face and how did I fix them?
    I faced a lot of errors regarding migrations, generating client, and also how to apply CRUD operations to my application controller. I managed to fix these through a mix of heavy researching and reading documentation as well as minor AI usage to explain things I did not understand

Milestone 3:
What is authentication?
    Authentication is a way for a user to access their data as well as act as a security path that essentially keeps the user's data safe. If you can't enter the system with a username and password (or oauth/or whatever), then the data isn't accessable/ isn't yours if you are trying to use someones credentials/
What is authorization?
    Authorization is a process where the user is assigned a certain role which corresponds to doing something in the system. For example, an admin will have certain permissions that allow them to do something that a normal user can and vise versa. A user with the role of USER shouldn't be able to do things an admin does.
What is password hashing?
    Password hashing is a process of turning a password into a fixed length output called a hash. This hash is a one way encryption, once a value is hashed it cannot be turned back into it's original value.
Why should we never store plain passwords?
    If the database has stored its passwords as plain strings, then in the case of a database breach or sql injection, a hacker can get the passwords easily and access user data. A BIG SECURITY RISK
What is JWT?
    JSON Web Token is a way of signing data using a secret/signiture to transmit data in a safe manner, esentially encrypting the data and only be able to access it if a proper signature is provided (via a secret for example.)
What is stored inside your JWT?
    A header, payload and signature 
What is Bearer authentication?
    An http security method granting access to whoever holds a unique access string called a bearer token, where the token itself is what allows access to data. Much like a ticket is needed in order to enter a ride in an amusement park.
How does req.user get added?
    Req.user in a typescript application can be added by adding the interface to the express namespace specfically the request interface. This is called decleartion merging, where we can add user as an interface property while calling the express namespace and it will add it to the already existing request interface
How did you prevent users from accessing each other’s data?
    Use prisma getfirst to compare the id of a data but also the userId with the current logged in user through req.user.id, which in turn will return nothing if the data's user id and the user id don't match.
What errors did I face and how did I fix them?
    A lot of the errors were advanced for me, like declaration merging and setting up a JWT auth middleware as well as implementing the prisma check, but I managed to fix them by doing some research on Google and reading the documentation, following examples provided by Google's AI overview (which was horrid at times that it pushed me to just go to stack overflow), and experiment where needed.

Milestonr 4:
What is Redis?
    Redis is server that acts like cache, basically an in memory data structure
What problem does Redis solve here?
    Makes data fetching quick as it doesn't focus on getting data from the database but just fetches what is stored in memory
What is Redis used for in my project?
    It was used as a way to rate limit logins as well as be a palce to store application stats
What is TTL?
    Time to live is basically setting an expiration for a redis key so it doesn't stay in redis's storage forever
What is caching?
    Caching is when we store data that is expensive or repeated to fetch in a faster place for a short amount of time. In this app, the dashboard stats are cached in Redis so if the user asks for the same stats again, the app can return it from Redis instead of recalculating everything from Postgres again.
What is cache invalidation?
    Cache invalidation is the process of clearing or updating cached data when the real data changes. For example, if a user creates, updates, or deletes an application, the old dashboard stats in Redis are no longer accurate, so the dashboard:stats:user:<userId> key should be deleted so the next request recalculates fresh stats from Postgres.
What is rate limiting?
    Rate limiting is a way to control how many times someone can do an action in a certain amount of time. In my app, failed logins are tracked using Redis with login:attempts:<email>. If someone fails too many times, they get blocked temporarily. This helps protect the login route from brute force attacks.
What is the difference between Postgres and Redis?
    Postgres is the main database and stores permanent application data like users and job applications. Redis stores temporary data in memory and is much faster, but it is not where I should keep my main app data. In this project, Postgres is the source of truth while Redis is used for cache, refresh tokens, and login attempt counts.
Why should I not store permanent application data in Redis?
    Redis is mainly memory based and is better for temporary or fast access data. Even though Redis can persist some data, it should not replace Postgres for important permanent data because Postgres is built for relational data, constraints, migrations, and long term storage. If Redis data expires or gets cleared, I should not lose important user applications.
How does logout work with Redis?
    In my current app I don't fully have logout implemented yet, but the concept is to delete the user's refresh token key from Redis. Since refresh tokens are stored using refresh:user:<userId>, logout would delete that key and clear the refreshToken cookie. After that, the old refresh token should no longer be usable to get a new access token.
What errors did I face and how did I fix them?
    I faced errors with Redis connection setup, key naming, and understanding when Redis should be used instead of Postgres. I also had to understand TTL, cache invalidation, and how to store refresh tokens and login attempts without making the keys messy. I fixed this by creating clear Redis key conventions like refresh:user:<userId>, login:attempts:<email>, and dashboard:stats:user:<userId>, and by using Redis only for temporary/cache related data rather than permanent application data.

MIlestonr 5:
What is HashiCorp Vault?
    It's a centeralized secret management system that's made to securley store and tightly control access to tokens and any other secrets used in a project.
What problem does Vault solve?
    I believe the main problem vault solves is having a centeralized place for secrets that anyone can use if they have the token and uri access to. It can also be used as a detailed audit log to see who accessed what secret.
Why is .env alone not ideal for secrets?
    The main issue for .env lies in production grade security as usually .env files are stored in a server in pure text so if there is any leaks or hacks the env file will be accessible to outside forces and in turn lead to access to everything. That and also there is no way to audit who accessed what with an .env file
What secrets did I move to Vault?
    I moved postgres credentials, redis set up, JWT secrets and expiry dates.
What does Vault dev mode mean?
    Basically sacrfices security for convinence which is okay in development mode as it is local to the developer and makes it easier to access the secrets for development purposes. Not meant for production purposes.
Why is dev mode unsafe for production?
    In-Memory Storage: All data is lost the moment the Vault server process stops or restarts.

    No TLS/HTTPS: Communication between your app and Vault is unencrypted, meaning credentials travel over the network in plain text, vulnerable to interception.

    Root Token Exposure: It initializes with a highly privileged, static root token displayed in clear text in the terminal, violating the principle of least privilege.

How does the app fetch secrets at startup?
    Through the use of node vault, I use the vault string stored in .env and access it via the token pass and then once recieved, I send it in an object manner to be used wherever required.
What happens if Vault is unavailable?
    Depending on how it is coded, the app can fail and not move forward as it does not have the necessary information to start services that are required for the application to run properly. 

What errors did I face and how did I fix them?
    A lot of the errors land on how to implement vault and how to call it programmatically which I managed to solve via reading documentation, stack overflow, and implementation examples on medium and AI overview.