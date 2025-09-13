#!/bin/bash

echo "Removing @CrossOrigin annotations from all controllers..."

# List of files with @CrossOrigin annotations
files=(
    "/home/alif/Projects/javafest/Postfolio/server/src/main/java/com/example/postfolio/follow/controller/FollowController.java"
    "/home/alif/Projects/javafest/Postfolio/server/src/main/java/com/example/postfolio/news/controller/NewsController.java"
    "/home/alif/Projects/javafest/Postfolio/server/src/main/java/com/example/postfolio/mcqGeneration/controller/PreparationController.java"
    "/home/alif/Projects/javafest/Postfolio/server/src/main/java/com/example/postfolio/enrollments/controller/EnrollmentController.java"
    "/home/alif/Projects/javafest/Postfolio/server/src/main/java/com/example/postfolio/interview/controller/InterviewController.java"
    "/home/alif/Projects/javafest/Postfolio/server/src/main/java/com/example/postfolio/interview/controller/InterviewProgressController.java"
    "/home/alif/Projects/javafest/Postfolio/server/src/main/java/com/example/postfolio/profile/controller/EducationController.java"
    "/home/alif/Projects/javafest/Postfolio/server/src/main/java/com/example/postfolio/profile/controller/WorkController.java"
    "/home/alif/Projects/javafest/Postfolio/server/src/main/java/com/example/postfolio/cradits/controller/CreditController.java"
    "/home/alif/Projects/javafest/Postfolio/server/src/main/java/com/example/postfolio/search/controller/SearchController.java"
    "/home/alif/Projects/javafest/Postfolio/server/src/main/java/com/example/postfolio/connection/controller/ConnectionController.java"
    "/home/alif/Projects/javafest/Postfolio/server/src/main/java/com/example/postfolio/tts/controller/TtsController.java"
    "/home/alif/Projects/javafest/Postfolio/server/src/main/java/com/example/postfolio/mentorship/controller/MentorshipController.java"
    "/home/alif/Projects/javafest/Postfolio/server/src/main/java/com/example/postfolio/notification/controller/NotificationController.java"
    "/home/alif/Projects/javafest/Postfolio/server/src/main/java/com/example/postfolio/dashboard/controller/DashboardController.java"
    "/home/alif/Projects/javafest/Postfolio/server/src/main/java/com/example/postfolio/message/controller/MessageController.java"
    "/home/alif/Projects/javafest/Postfolio/server/src/main/java/com/example/postfolio/roadmap/controller/RoadmapController.java"
)

# Remove @CrossOrigin annotations from each file
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "Processing $file"
        # Remove lines containing @CrossOrigin
        sed -i '/@CrossOrigin/d' "$file"
        echo "Removed @CrossOrigin from $file"
    else
        echo "File not found: $file"
    fi
done

echo "Finished removing @CrossOrigin annotations!"