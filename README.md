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