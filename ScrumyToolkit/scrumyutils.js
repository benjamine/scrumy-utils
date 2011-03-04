
var scrumyutils = {};

(function(){

    scrumyutils.batchAddTask = function(scrumyname, pwd, tasktitle, scrumer_name, setStatus){
    
        if (!scrumyname) {
            setStatus('scrumy name is required');
            return;
        }
        if (!pwd) {
            setStatus('password is required');
            return;
        }
        
        var usrpwd64 = Base64.encode(scrumyname + ':' + pwd);
        var currenturl = 'https://scrumy.com/api/scrumies/' + scrumyname + '/sprints/current.json';
        
        setStatus('accessing scrumy ' + scrumyname);
        
        jQuery.ajax({
            url: currenturl,
            beforeSend: function(req){
                req.setRequestHeader("Origin", document.location.protocol + "//" + document.location.host);
                req.setRequestHeader("Authorization", "Basic " + usrpwd64);
            },
            success: function(data, textStatus, req){
            
                if (!data.sprint) {
                    setStatus('error loading current sprint');
                }
                else {
                    var sprint = data.sprint;
                    if (!sprint.stories || sprint.stories.length == 0) {
                        // no stories
                        setStatus('no stories found on current sprint');
                    }
                    else {
                        setStatus(sprint.stories.length + ' stories found on current sprint');
                        var tasksAdded = 0;
                        if (sprint.stories) {
                            for (var i = 0; i < sprint.stories.length; i++) {
                                var story = sprint.stories[i].story;
                                var exists = false;
                                if (story.tasks) {
                                    for (var j = 0; j < story.tasks.length; j++) {
                                        var task = story.tasks[j].task;
                                        if ($.trim(task.title || '').toLowerCase() == $.trim(tasktitle || '').toLowerCase()) {
                                            exists = true;
                                            break;
                                        }
                                    }
                                }
                                if (!exists) {
                                    currenturl = 'https://scrumy.com/api/stories/' + story.id + '/tasks';
                                    $.ajax({
                                        url: currenturl,
                                        data: {
                                            title: tasktitle,
                                            scrumer_name: scrumer_name
                                        },
                                        contentType: 'application/x-www-form-urlencoded',
                                        type: 'POST',
                                        beforeSend: function(req){
                                            req.setRequestHeader("Origin", document.location.protocol + "//" + document.location.host);
                                            req.setRequestHeader("Authorization", "Basic " + usrpwd64);
                                        },
                                        success: function(data, textStatus, req){
                                            // task added
                                            tasksAdded++;
                                            setStatus(tasksAdded + ' tasks added');
                                        },
                                        error: function(req, textStatus, error){
                                            setStatus('error adding task: ' + textStatus + ' ' + error);
                                        }
                                    });
                                }
                                
                            }
                        }
                    }
                }
            },
            error: function(req, textStatus, error){
                setStatus('error accessing current sprint: ' + textStatus + ' ' + error);
            }
        });
        
    };
    
    scrumyutils.batchChangeTasks = function(scrumyname, pwd, titleContains, inStatus, addToTaskTitle, newscrumer_name, setStatus){
    
        if (!scrumyname) {
            setStatus('scrumy name is required');
            return;
        }
        if (!pwd) {
            setStatus('password is required');
            return;
        }
        
        var usrpwd64 = Base64.encode(scrumyname + ':' + pwd);
        var currenturl = 'https://scrumy.com/api/scrumies/' + scrumyname + '/sprints/current.json';
        
        setStatus('accessing scrumy ' + scrumyname);
        
        jQuery.ajax({
            url: currenturl,
            beforeSend: function(req){
                req.setRequestHeader("Origin", document.location.protocol + "//" + document.location.host);
                req.setRequestHeader("Authorization", "Basic " + usrpwd64);
            },
            success: function(data, textStatus, req){
            
                if (!data.sprint) {
                    setStatus('error loading current sprint');
                }
                else {
                    var sprint = data.sprint;
                    if (!sprint.stories || sprint.stories.length == 0) {
                        // no stories
                        setStatus('no stories found on current sprint');
                    }
                    else {
                        setStatus(sprint.stories.length + ' stories found on current sprint');
                        var tasksChanged = 0;
                        
                        titleContains = jQuery.trim(titleContains || '').toLowerCase();
                        
                        for (var i = 0; i < sprint.stories.length; i++) {
                            var story = sprint.stories[i].story;
                            if (story.tasks) {
                                for (var j = 0; j < story.tasks.length; j++) {
                                    var task = story.tasks[j].task;
                                    
                                    var changeTask = true;
                                    
                                    if (titleContains) {
                                        if (jQuery.trim(task.title || '').toLowerCase().indexOf(titleContains) < 0) {
                                            changeTask = false;
                                            continue;
                                        }
                                    }
                                    if (inStatus && inStatus != '' && inStatus != 'any') {
                                        if (inStatus != task.state) {
                                            changeTask = false;
                                            continue;
                                        }
                                    }
                                    
                                    if ((task.title == (task.title + addToTaskTitle) || '') &&
                                    ((!task.scrumer && (newscrumer_name == '' || newscrumer_name == 'UNASSIGNED')) ||
                                    (task.scrumer && task.scrumer.name == newscrumer_name))) {
                                        // no change needed
                                        changeTask = false;
                                        continue;
                                    }
                                    
                                    if (changeTask) {
                                        currenturl = 'https://scrumy.com/api/tasks/' + task.id + '.json';
                                        try {
                                            jQuery.ajax({
                                                async: false,
                                                url: currenturl,
                                                data: {
                                                    title: (task.title + addToTaskTitle) || '',
                                                    scrumer_name: (newscrumer_name || (task.scrumer && task.scrumer.name))
                                                },
                                                context: {
                                                    task: task,
                                                    story: story
                                                },
                                                contentType: 'application/x-www-form-urlencoded',
                                                type: 'PUT',
                                                beforeSend: function(req){
                                                    req.setRequestHeader("Origin", document.location.protocol + "//" + document.location.host);
                                                    req.setRequestHeader("Authorization", "Basic " + usrpwd64);
                                                },
                                                success: function(data, textStatus, req){
                                                    // task changed
                                                    tasksChanged++;
                                                    setStatus(tasksChanged + ' tasks changed');
                                                },
                                                error: function(req, textStatus, error){
                                                    if (req.status = 200 && textStatus == 'parsererror') {
                                                        // task changed
                                                        tasksChanged++;
                                                        setStatus(tasksChanged + ' tasks changed');
                                                    }
                                                    else {
                                                        setStatus('<br/>error changing task #' + this.task.id + ' \'' + this.task.title + '\' in story \'' + this.story.title + '\': ' + textStatus + ' ' + error);
                                                    }
                                                }
                                            });
                                        } 
                                        catch (ex) {
                                            setStatus('error: ' + ex);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            error: function(req, textStatus, error){
                setStatus('error accessing current sprint: ' + textStatus + ' ' + error);
            }
        });
        
    };
    
    scrumyutils.inputState = {};
    
    scrumyutils.inputState.save = function(key){
        var data = $('input, select').filter(function(){
            return this.type != 'password' && !!this.id;
        }).serialize();
        $.cookie(key || 'inputstate', data, {
            path: '/',
            expires: 7
        });
        return scrumyutils.inputState;
    }
    
    scrumyutils.inputState.restore = function(key){
    
        var data = $.cookie(key || 'inputstate');
        if (data) {
            fields = data.split('&');
            for (var i = 0; i < fields.length; i++) {
                var kv = fields[i].split('=');
                $('#' + kv[0]).val(kv[1]);
            }
        }
        return scrumyutils.inputState;
    }
    
})();
