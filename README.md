This is a Secure Job Application Tracker API built with Node.js, Express, TypeScript, Prisma, PostgreSQL, Redis, Vault, and Docker. Milestone 1 focuses only on setting up a clean TypeScript Express API foundation.

Milestone 1:
What did I set up?
 An typescript express application, that has a dockerfile and compose file set up 
What is Express responsible for?
 It is responsible for creating a ready to go server and create apis in an opinionated manner
What is TypeScript responsible for?
 Typescript is here to provide type saftey for the application. This means that every variable, function, return, etc have a type which makes the application much more robust and safer to use
What does Docker do here?
 Docker solves the "It works on my machine" issue every dev goes through by putting together the application in containers that cna be used by everyone (basically mimics your local environment on someone elses pc)
What is the difference between running locally and running in Docker?
    Running locally has the user use their own resources via the hosts OS while docker runs it all in a container and with the added bonus of having multiple containers running rather than having to install and external dependencies (like databases or redis). Plus whoever is running an application on docker runs it on the version the app  was created on (Ex. If app is created using Node 18, and a teammate has Node 20 installed, docker runs the app using node 18 (via the image built in the dockerfile))
What errors did I face and how did I fix them?
    A lot of the errors I faced were primarily setting up typescript and the docker files. I was very inclined to use AI to do it for me, however I went into the rabbithole of research and used AI to help me understand what I was reading during times of confusion. I managed to set it all up right at the end.