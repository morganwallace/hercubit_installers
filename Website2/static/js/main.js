// Backend info
// var username = "kate";

var badgeName = ["Newbie","Goal","Strike3","Strike7","Five","Completion"];
var badgeDesc = ["Signed up for Hercubit!", "Set your first goal!","3-day Strike!","7-day Strike!","Five sessions!","Complete your first exercise!"];
var badgeArray = [0,0,0,0,0,0];
var flagFTG = 0;

var activityArray = [0,0,0,0,0,0,0];
var startDate = new Date("2014-04-09");

var friendArray = [];

$(document).ready(function () {

    /* If first time use */
    var firstTimeUse = 1;

    if ($("#username").html()!='') {
        console.log('user already logged in as: '+ $("#username").text())
        firstTimeUse=false;
    }
    if (firstTimeUse) {
        $("#white-overlay").show();
        $("#signup-form").show();
        $("header div.header-action").hide();
    }


    $("#signup").submit(function(e){
        $("#white-overlay").hide();
        $("#signup-form").hide();
        $("header div.header-action").show();
        e.preventDefault();
        $("#username").text($("#username").text().toLowerCase());
        signup();
        
    });


    function signup(){
      $.post("./signup",
        $("#signup").serialize(),
        function(data){
            console.log('signup');
            console.log(data.new_user);
          if(data.new_user == false){
            console.log("old user");
            window.onbeforeunload = function(){}
            window.location.href= "/";
          }
          else{
            console.log('checking for new user')
            getNewBadge(0);
          }
      
          return false;
        }
      )}

    //When the user clicks logout call logout in app.py and delete cookie
    // then refresh when python sends the success response
    $("#logout").click(function(){
        logout();
    });
    function logout(){
            $.post("./logout",
                function(data){
                    console.log('successful logout');

                    //send the user back to the log in screen by refreshing.
                    window.onbeforeunload = function(){}
                    window.location.href ="/";
                }
                
        );
        
        return false;

    }

    /* Start */
    /************************************************************************/

  	// Click Start to see count
  	$("#startbtn").on('click', function(){
  		if ($("section.metadata").attr('data-state') === 'neutral') {
              $("section.metadata").attr('data-state', 'slide-out');
              $("section.social").attr('data-state', 'slide-out');
              $("section.main .card").attr('data-state', 'slide-out');
              $("section.main #count").attr('data-state', 'slide-out');
              $("#startbtn").attr('data-state', 'slide-out');
              $("#startbtn").text("Done");
          } 
          else {
              $("section.metadata").attr('data-state', 'neutral');
              $("section.social").attr('data-state', 'neutral');
              $("section.main .card").attr('data-state', 'neutral');
              $("section.main #count").attr('data-state', 'neutral');
              $("#startbtn").attr('data-state', 'neutral');
              $("#startbtn").text("Start");
          }
  	});

    /* Goal */
    /************************************************************************/
    updateGoals();

    /* Activity */
    /************************************************************************/
    getActivities();


    /* Friends */
    /************************************************************************/
    // TODO: Loop through database to get friend list
    getFriends();

    /* Comment off for hiding the Message & Challenge buttons */
    // $("html").on("click", function(){
    //     $("div.friend").css("height", "80px");
    //     $("div.friend").find("div.menu").hide();
    // })
    // $("div.friend").on("click", function(e){
    //     e.stopPropagation();
    //     $("div.friend").css("height", "80px");
    //     $("div.friend").find("div.menu").hide();
    //     $(this).css("height","160px");
    //     $(this).find("div.menu").show();
    // });


    /* Achievements */
    checkBadge();

    //Show exercise .gif based on which is selected.
  $("#pick_exercise").change(function(){
    console.log($("#pick_exercise").val());
    if($("#pick_exercise").val()=='Tricep'){
      console.log("changing to tricp gif")
      $("#goal_pic_gif").html('<img src="../static/img/tricep_kickbacks.gif">');
    }
    else if($("#pick_exercise").val()=='Bicep'){
     $("#goal_pic_gif").html('<img src="../static/img/bicep_curl.gif">'); 
    }
    else if($("#pick_exercise").val()=='Shoulder'){
     $("#goal_pic_gif").html('<img src="../static/img/shoulder_press.gif">');  
    }
  });

});


function updateGoals() {
  $("div.goal").hover(
      function() {
          $(this).children(".trash").attr('data-state', 'hover');
      },
      function() {
          $(this).children(".trash").attr('data-state', 'neutral');
      }
  );
  // Click to delete the goal
  $("div.goal .trash").on('click', function(){
      // console.log($(this).parent()[0].id);
    
      $.post ("/deleteGoal",
        { id: $(this).parent()[0].id },
        // $("#modal-add-goal").serialize(),
        function(data) {
          console.log("delete goal");
          window.onbeforeunload = function(){}
          window.location.href = "/";
        }
      );
      // e.preventDefault();

  });
  // Click to choose the goal
  $("div.goal").on('click', function(){
      if (this.id!=="add-goal") {
          $("#chosen-goal span").html($(this).find('div.num').text() +": "+ $(this).find('div.desc').html())
          $("#startbtn").removeClass("disable");
      }
  });

  // Pop up Modal after clicking on Add goal
  $("#add-goal").on('click', function(){
      $("#modal-overlay").show();
      $("#modal-goal").show();
  });
  $("#modal-overlay").on('click', function(){
      $("#modal-overlay").hide();
      $("#modal-goal").hide();
      $("#modal-badge").hide();
      if (flagFTG==1) {
        window.onbeforeunload = function(){}
        window.location.href = "/"; 
      }
  });
  $("#modal-add-goal").submit(function(e){
      $("#modal-overlay").hide();
      $("#modal-goal").hide();

      $.post ("/addGoal",
        $("#modal-add-goal").serialize(),
        function(data) {
          console.log("post addGoal");
          // TODO: FIX the disappearing modal window

          // seems to be fixed..


          getNewBadge(1);
        }
      );

      e.preventDefault();

  });
}

function getFriends() {

  $.post("/getFriendActivities",
    { username: "" },
    function(data) {
      friendArray = data;
      updateFriends();
    }
  );
}

function updateFriends() {

  for (var i=1; i<friendArray['userInfo'].length+1; i++) {

    $("section.social div.card").append('<div class="friend lines clear" id="friend'+i+'"><div class="left"><div class="icon"><img src="../static/img/'+friendArray['userInfo'][i-1]['username']+'.jpg"></div></div><div class="right"><div class="name">'+friendArray['userInfo'][i-1]['username']+'</div><div class="menu" id="menu'+i+'"></div></div></div>');

    for (var k=0; k<7; k++) {
      var code = '<div class="code" id="code-'+i+k+'"></div>';
      $("#menu"+i).append(code);
      $("#code-"+i+k).addClass("level-"+friendArray['userInfo'][i-1]['act_day'+k]);
    }
  }

}


function getActivities() {
  $.post("/getActivities",
    function(data) {
      // console.log(data);
      for (var i=0; i<7; i++) {
        activityArray[i] = data['userInfo']['act_day'+i];
      }
      console.log("activityArray: "+activityArray);
      for (var i=1; i<activityArray.length+1; i++) {
        var code = '<div class="code" id="code-'+i+'"></div>';
        $("#activity-map").append(code);
        $("#code-"+i).addClass("level-"+activityArray[i-1]);
      }

    }
  );  
}

function determineActivity() {
  $.post("/determineActivity",
    function(data) {
      // console.log(data);
      var todayDate = new Date();
      var diff = new Date(todayDate-startDate);
      diff = Math.floor(diff/1000/60/60/24);
      console.log("diff"+diff);
      var e = data['activityInfo']['E'];
      var g = data['activityInfo']['G'];
      var level = 0;

      if (e==0) {
        level = 0;
      }
      else if (e<g) {
        level = 1;
      }
      else if (e==g) {
        level = 2;
      }
      else if (e>g) {
        level = 3;
      }
      else {
        level = 0;
        console.log("Something wrong with activity map");
      }
      activityArray[diff] = level;
      for (var i=1; i<activityArray.length+1; i++) {
        var code = '<div class="code" id="code-'+i+'"></div>';
        $("#activity-map").append(code);
        $("#code-"+i).addClass("level-"+activityArray[i-1]);
      }

      updateActivity(diff, level);
    }
  );    
}

function updateActivity(diff, level) {
  console.log("updateActivity, diff="+diff);
  $.post("/updateActivity",
    { diff: diff,
      level: level },
    function(data) {
      console.log("updateActivity success");
    }
  );
}

function checkBadge() {
  $.post("/checkBadge",
    function(data) {
      console.log(data)
      for (var i=1; i<7; i++) {
        badgeArray[i-1] = data['userInfo']['badge'+i];
      }
      updateBadge(); 
    }
  )
};

function updateBadge() {
  for (var i=1; i<7; i++) {
    // badge already get
    if (badgeArray[i-1]==1) { 
      $("#badge"+i+" img").attr("src","../static/img/"+badgeName[i-1]+".png");
    }
    else { 

    }
    $("#badge"+i).hover((function(i){
      return function(){
        $(".tooltip").html("<p>"+badgeName[i-1]+"</p><p>"+badgeDesc[i-1]+"</p>");
        $(".tooltip").css("top", $(this).position().top+20);
        $(".tooltip").css("left", $(this).position().left);
        $(".tooltip").show();
      }
    })(i),
    (function(i){
      return function(){
        $(".tooltip").hide();
      }
    })(i));
  }
}


function getNewBadge (badgeNum) {
  checkBadge();
  // console.log(badgeNum);
  // console.log(badgeArray[badgeNum]);
  if (badgeArray[badgeNum]==0) {
    // doesn't have the badge
    // put sql determine call here
    determineBadge(badgeNum);
  }
  if (badgeArray[1]==1 && badgeNum==1) {
    window.onbeforeunload = function(){}
    window.location.href = "/"; 
  }

}

function determineBadge (badgeNum) {
  $.post("/determineBadge",
    { badgeNum: badgeNum },
    function(data) {

      if (data['badgeInfo']['st']==1 || badgeNum==0) {
        $("#modal-badge").find("h1").text(badgeName[badgeNum]);
        $("#modal-badge").find("img").attr("src","../static/img/"+badgeName[badgeNum]+".png");
        $("#modal-badge").find("span").text("You've " + badgeDesc[badgeNum]);
        $("#modal-overlay").show();
        $("#modal-badge").show();
        $("#modal-badge").addClass("animated bounceIn");
        if (badgeNum==1) {
          flagFTG = 1;
        }

        insertBadge(badgeNum);
      }
    }
  )  
}

function insertBadge(badgeNum) {
  badgeNum = badgeNum + 1;

  $.post("/insertBadge",
    { badgeNum: badgeNum },
    function(data) {
      checkBadge();
    }
  );
};

function forTooltip(i) {
  return function() {
    return badgeName[i-1];
  }
}



// window.onbeforeunload = function(){
//     return "Please instead click 'Quit' in the top right to exit and allow the application to shutdown as well. Thank you.";
// }

