$(document)
    .ready(function() {
        // Scrape New Articles Button
        $(document).on("click", "#scrapeButton", handleScrapeButton);

        function handleScrapeButton() {
            console.log("Scrape Button Clicked");
            $
                .get("/scrape")
                .then(function(data) {
                    console.log("Count: " + data.count);
                    $("#numArticles").text("Added " + data.count + " new articles!");
                    $("#scrapeModal").modal();
                })
                .catch(function(err) {
                    console.log(err);
                });
        };

        // Scrape Close Button
        $(document).on("click", ".scrapeCloseButton", handleScrapeCloseButton);

        function handleScrapeCloseButton() {
            console.log("Scrape Close Button Clicked");
            window
                .location
                .reload();
        };

        // Save Article Button
        $(document).on("click", ".saveArticleButton", handleSaveArticleButton);

        function handleSaveArticleButton() {
            console.log("Save Article Button Clicked");
            var route = "/saveArticle/" + $(this).val();
            $
                .post(route)
                .then(function(data) {
                    console.log("Article saved");
                    window
                        .location
                        .reload();
                })
                .catch(function(err) {
                    console.log(err);
                });
        };

        // Delete Article From Saved Button
        $(document).on("click", ".deleteArticleButton", handleDeleteArticleButton);

        function handleDeleteArticleButton() {
            console.log("Delete Article Button Clicked");
            var route = "/deleteArticle/" + $(this).val();
            $
                .post(route)
                .then(function(data) {
                    console.log("Article deleted");
                    window
                        .location
                        .reload();
                })
                .catch(function(err) {
                    console.log(err);
                });
        };

        // Article Notes Button
        $(document).on("click", ".articleNotesButton", handleArticleNotesButton);

        function handleArticleNotesButton() {
            console.log("Article Notes Button Clicked");
            $("#notesTitle").text("Notes for Article: " + $(this).val());
            var route = "/notes/" + $(this).val();
            $(".saveNoteButton").data("article", $(this).val());
            $
                .get(route)
                .then(function(data) {
                    console.log("Notes: " + data.notes);
                    if (data.notes.length > 0) {
                        $(".noteBody").empty();
                        for (var i = 0; i < data.notes.length; i++) {
                            $(".noteBody").append('<div class="noteRecord">' + data.notes[i].body + '<span class="pull-right"> <button type="button" class="btn btn-danger deleteNote' +
                                'Button" value="' + data.notes[i]._id + '">X</button> </span></div>');
                        }
                    } else {
                        $(".noteBody").text("No notes for this article yet.");
                    }
                    $("#notesModal").modal();
                })
                .catch(function(err) {
                    console.log(err);
                });
        };

        // Save Note Button
        $(document).on("click", ".saveNoteButton", handleSaveNoteButton);

        function handleSaveNoteButton() {
            console.log("Save Note Button Clicked");
            var route = "/saveNote/" + $(".saveNoteButton").data("article");
            $
                .post(route, {
                    noteText: $("#noteText").val()
                })
                .then(function(data) {
                    console.log("Note saved");
                    $("#noteText").val("");
                })
                .catch(function(err) {
                    console.log(err);
                });
        };

        // Delete Note Button
        $(document).on("click", ".deleteNoteButton", handleDeleteNoteButton);

        function handleDeleteNoteButton() {
            console.log("Delete Note Button Clicked");
            var noteID = $(this).val();
            var route = "/deleteNote/" + $(".saveNoteButton").data("article");
            $
                .post(route, { noteID: noteID })
                .then(function(data) {
                    console.log("Note deleted");
                    window
                        .location
                        .reload();
                })
                .catch(function(err) {
                    console.log(err);
                });
        };
    });