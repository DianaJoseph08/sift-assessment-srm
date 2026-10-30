export const TRACKER_SCHEMA=[
  {
    "name": "Open Position Tracker Master",
    "kind": "demand",
    "columns": [
      {
        "label": "Sr No",
        "key": "serial",
        "type": "text",
        "computed": true
      },
      {
        "label": "Position Code",
        "key": "sowId",
        "type": "text",
        "computed": false
      },
      {
        "label": "Position Open Date",
        "key": "openDate",
        "type": "date",
        "computed": false
      },
      {
        "label": "Ageing",
        "key": "ageing",
        "type": "text",
        "computed": true
      },
      {
        "label": "Client",
        "key": "customerId",
        "type": "text",
        "computed": false
      },
      {
        "label": "CLUSTER Classification",
        "key": "clusterId",
        "type": "text",
        "computed": false
      },
      {
        "label": "Client Head",
        "key": "clientHead",
        "type": "text",
        "computed": false
      },
      {
        "label": "Client Manager",
        "key": "clientManager",
        "type": "text",
        "computed": false
      },
      {
        "label": "Client SPOC",
        "key": "clientSpoc",
        "type": "text",
        "computed": false
      },
      {
        "label": "MTSL SPOC",
        "key": "mtslSpoc",
        "type": "text",
        "computed": false
      },
      {
        "label": "Skills - Description",
        "key": "title",
        "type": "text",
        "computed": false
      },
      {
        "label": "Combination Skillset",
        "key": "combinationSkills",
        "type": "text",
        "computed": false
      },
      {
        "label": "Grade",
        "key": "grade",
        "type": "text",
        "computed": false
      },
      {
        "label": "Experience Range",
        "key": "experience",
        "type": "text",
        "computed": false
      },
      {
        "label": "Position Status",
        "key": "status",
        "type": "text",
        "computed": false
      },
      {
        "label": "Position Type",
        "key": "positionType",
        "type": "text",
        "computed": false
      },
      {
        "label": "Replacement Employee Name",
        "key": "replacementName",
        "type": "text",
        "computed": false
      },
      {
        "label": "<-- LWD",
        "key": "lwd",
        "type": "date",
        "computed": false
      },
      {
        "label": "No. Of Open Position",
        "key": "vacancies",
        "type": "number",
        "computed": false
      },
      {
        "label": "Active Positions",
        "key": "active",
        "type": "text",
        "computed": true
      },
      {
        "label": "Doable /Non Doable",
        "key": "doable",
        "type": "text",
        "computed": false
      },
      {
        "label": "Location",
        "key": "location",
        "type": "text",
        "computed": false
      },
      {
        "label": "Offered/Yet to Join / Shortlisted",
        "key": "offered",
        "type": "text",
        "computed": true
      },
      {
        "label": "Joined / Closed",
        "key": "joined",
        "type": "text",
        "computed": true
      },
      {
        "label": "Hold/Cancelled",
        "key": "hold",
        "type": "text",
        "computed": true
      },
      {
        "label": "Non Doable/YTC",
        "key": "nonDoable",
        "type": "text",
        "computed": true
      },
      {
        "label": "Profile Status",
        "key": "profileStatus",
        "type": "text",
        "computed": false
      },
      {
        "label": "Candidate Name",
        "key": "candidateNames",
        "type": "text",
        "computed": false
      },
      {
        "label": "MTSL DOJ",
        "key": "mtslDoj",
        "type": "date",
        "computed": false
      },
      {
        "label": "CTC Budget",
        "key": "budget",
        "type": "text",
        "computed": false
      },
      {
        "label": "Actual GM%",
        "key": "actualGM",
        "type": "text",
        "computed": false
      },
      {
        "label": "Source",
        "key": "source",
        "type": "text",
        "computed": false
      },
      {
        "label": "Industry",
        "key": "industry",
        "type": "text",
        "computed": false
      },
      {
        "label": "Reason for Cancelled/Lost/Hold",
        "key": "reason",
        "type": "text",
        "computed": false
      },
      {
        "label": "Hold / Cancelled Date",
        "key": "holdDate",
        "type": "date",
        "computed": false
      },
      {
        "label": "Deadline",
        "key": "deadline",
        "type": "date",
        "computed": false
      },
      {
        "label": "Remarks",
        "key": "remarks",
        "type": "text",
        "computed": false
      },
      {
        "label": "Target Companies",
        "key": "targetCompanies",
        "type": "text",
        "computed": false
      },
      {
        "label": "Challenges",
        "key": "challenges",
        "type": "text",
        "computed": false
      }
    ]
  },
  {
    "name": "Supply Master Data",
    "kind": "application",
    "columns": [
      {
        "label": "Sl No",
        "key": "serial",
        "type": "text",
        "computed": true
      },
      {
        "label": "Internal Submission Date",
        "key": "internalSubmissionDate",
        "type": "date",
        "computed": false
      },
      {
        "label": "Internal feedback date",
        "key": "internalFeedbackDate",
        "type": "date",
        "computed": false
      },
      {
        "label": "Cust.Sub.Date",
        "key": "customerSubmissionDate",
        "type": "date",
        "computed": false
      },
      {
        "label": "Cust.Feed.Date",
        "key": "customerFeedbackDate",
        "type": "date",
        "computed": false
      },
      {
        "label": "Customer Interview Date",
        "key": "interviewDate",
        "type": "date",
        "computed": false
      },
      {
        "label": "Onboarding Date MTSL",
        "key": "actualJoining",
        "type": "date",
        "computed": false
      },
      {
        "label": "Client",
        "key": "customerId",
        "type": "text",
        "computed": false
      },
      {
        "label": "Cluster",
        "key": "clusterId",
        "type": "text",
        "computed": false
      },
      {
        "label": "REQ/SOWID",
        "key": "sowId",
        "type": "text",
        "computed": false
      },
      {
        "label": "Client Manager",
        "key": "clientManager",
        "type": "text",
        "computed": false
      },
      {
        "label": "Column1",
        "key": "normalizedSow",
        "type": "text",
        "computed": true
      },
      {
        "label": "Skill",
        "key": "skill",
        "type": "text",
        "computed": false
      },
      {
        "label": "Recruiter",
        "key": "recruiter",
        "type": "text",
        "computed": false
      },
      {
        "label": "Source",
        "key": "source",
        "type": "text",
        "computed": false
      },
      {
        "label": "Internal Feedback Pending",
        "key": "stage",
        "type": "text",
        "computed": false
      },
      {
        "label": "Candidate Name",
        "key": "name",
        "type": "text",
        "computed": false
      },
      {
        "label": "Total Exp. (Years)",
        "key": "experience",
        "type": "text",
        "computed": false
      },
      {
        "label": "Relevant Exp",
        "key": "relevantExperience",
        "type": "text",
        "computed": false
      },
      {
        "label": "Notice Period",
        "key": "noticePeriod",
        "type": "text",
        "computed": false
      },
      {
        "label": "Current / Last Company",
        "key": "currentCompany",
        "type": "text",
        "computed": false
      },
      {
        "label": "Current location",
        "key": "currentLocation",
        "type": "text",
        "computed": false
      },
      {
        "label": "Preferred location",
        "key": "preferredLocation",
        "type": "text",
        "computed": false
      },
      {
        "label": "Qualification",
        "key": "qualification",
        "type": "text",
        "computed": false
      },
      {
        "label": "Current CTC",
        "key": "currentCTC",
        "type": "text",
        "computed": false
      },
      {
        "label": "ECTC",
        "key": "expectedCTC",
        "type": "text",
        "computed": false
      },
      {
        "label": "Internal /External",
        "key": "employmentType",
        "type": "text",
        "computed": false
      },
      {
        "label": "Grade",
        "key": "grade",
        "type": "text",
        "computed": false
      },
      {
        "label": "Column3",
        "key": "extra3",
        "type": "text",
        "computed": false
      },
      {
        "label": "Column4",
        "key": "extra4",
        "type": "text",
        "computed": false
      },
      {
        "label": "Column5",
        "key": "extra5",
        "type": "text",
        "computed": false
      },
      {
        "label": "Column6",
        "key": "extra6",
        "type": "text",
        "computed": false
      },
      {
        "label": "Column7",
        "key": "extra7",
        "type": "text",
        "computed": false
      },
      {
        "label": "Column8",
        "key": "extra8",
        "type": "text",
        "computed": false
      },
      {
        "label": "Column9",
        "key": "extra9",
        "type": "text",
        "computed": false
      },
      {
        "label": "Column10",
        "key": "extra10",
        "type": "text",
        "computed": false
      }
    ]
  },
  {
    "name": "Offered Tracker",
    "kind": "offer",
    "columns": [
      {
        "label": "S.No",
        "key": "serial",
        "type": "text",
        "computed": true
      },
      {
        "label": "Tag Lead",
        "key": "tagLead",
        "type": "text",
        "computed": false
      },
      {
        "label": "PMO",
        "key": "pmo",
        "type": "text",
        "computed": false
      },
      {
        "label": "TAG Member",
        "key": "recruiter",
        "type": "text",
        "computed": false
      },
      {
        "label": "SOW ID",
        "key": "sowId",
        "type": "text",
        "computed": false
      },
      {
        "label": "Cluster",
        "key": "clusterId",
        "type": "text",
        "computed": false
      },
      {
        "label": "Client Name",
        "key": "customerId",
        "type": "text",
        "computed": false
      },
      {
        "label": "Skill",
        "key": "skill",
        "type": "text",
        "computed": false
      },
      {
        "label": "Candidate Name",
        "key": "name",
        "type": "text",
        "computed": false
      },
      {
        "label": "Exp.",
        "key": "experience",
        "type": "text",
        "computed": false
      },
      {
        "label": "CTC",
        "key": "currentCTC",
        "type": "text",
        "computed": false
      },
      {
        "label": "ECTC",
        "key": "expectedCTC",
        "type": "text",
        "computed": false
      },
      {
        "label": "NP",
        "key": "noticePeriod",
        "type": "text",
        "computed": false
      },
      {
        "label": "Date of Selection",
        "key": "selectionDate",
        "type": "date",
        "computed": false
      },
      {
        "label": "Date of Offer",
        "key": "offerDate",
        "type": "date",
        "computed": false
      },
      {
        "label": "Joining Date",
        "key": "expectedJoining",
        "type": "date",
        "computed": false
      },
      {
        "label": "Department",
        "key": "department",
        "type": "text",
        "computed": false
      },
      {
        "label": "Joining Status",
        "key": "stage",
        "type": "text",
        "computed": false
      },
      {
        "label": "Source",
        "key": "source",
        "type": "text",
        "computed": false
      },
      {
        "label": "Remarks",
        "key": "remarks",
        "type": "text",
        "computed": false
      },
      {
        "label": "DOJ",
        "key": "actualJoining",
        "type": "date",
        "computed": false
      }
    ]
  }
];
export const TRACKER_TABS=["Open Position Tracker Master","Supply Master Data","Dashboard","DV_DailyTrack","Offered Tracker","Summary_Bosch","Recruiter Vise"];

export const TRACKER_REFERENCE={"Dashboard": [[null, null, "2026-07-01T00:00:00", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, "Client Manager", "Minnal", "Suganya", "Usha", "Roshan", "Nikhil", "Shobha", "Priya", "Charan", "Total", null, null, null, null, null, null, null, null, null, null], [null, "Open Position", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, "Profiles submitted by TAG", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, "Customer Feedback Pending", null, null, null, null, null, null, null, null, null, null, null, "Bosch", null, null, null, null, null, null, null], [null, "Customer Interview Scheduled", "2", null, null, null, null, null, null, null, null, null, null, "Client", "Total  Positions", "Active Demands", "Joined", "Offered/YTJ", "Hold/Cancelled", "Drop", null], [null, "Internal Interview in Process", null, null, null, null, null, null, null, null, null, null, null, "SAP", null, null, null, null, null, "2", null], [null, "Internal Feedback Pending", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, "L1 Interview Feedback Pending", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Screen", "Customer Profile Reject", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, "Customer Interview Reject", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, "Internal Interview Reject", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, "Internal Porfile Reject", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "Suganya"], [null, "To be offered", null, null, null, null, null, null, null, null, null, null, null, null, null, "Client Manager", "Active Demands", null, null, null, "Usha"], [null, "Offered", null, null, null, null, null, null, null, null, null, null, null, null, null, "Suganya", null, null, null, null, "Roshan"], [null, "Customer Select", null, null, null, null, null, null, null, null, null, null, null, null, null, "Usha", null, null, null, null, "Vyshnavi Backup"], [null, "Joined", null, null, null, null, null, null, null, null, null, null, null, null, null, "Roshan", null, null, null, null, "Shobha"], [null, "Candidate Drop", null, null, null, null, null, null, null, null, null, null, null, null, null, "Nikhil", null, null, null, null, "Priya"], [null, "Position Hold", null, null, null, null, null, null, null, null, null, null, null, null, null, "Shobha", null, null, null, null, "Charan"], [null, "Profile Hold", null, null, null, null, null, null, null, null, null, null, null, null, null, "Priya", null, null, null, null, null], [null, "Positions Closed", null, null, null, null, null, null, null, null, null, null, null, null, null, "Charan", null, null, null, null, null], [null, "Duplicate from customer end", null, null, null, null, null, null, null, null, null, null, null, null, null, "Minnal", null, null, null, null, null], [null, "Shared profile with the Customer ", null, null, null, null, null, null, null, null, null, null, null, null, null, "Sum", null, null, null, null, null], [null, "Cummulative onboarding", null, null, null, null, "0", null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, "Client Manager", "Arthi", "Santhosh", "Harsha", "Basava", "TMD Rajesh", null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, "JD not with us/Not shared by customer", null, null, "0", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]], "DV_DailyTrack": [[null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "Internal Feedback Pending", null, "Customer", null, null, null, null, null, "Position Status", null, "Client Head"], [null, null, null, null, null, "Customer Feedback Pending", null, "Bosch", null, null, null, null, null, "Active", null, "Sujith - SDS"], [null, null, null, null, null, "Internal Tool Test Scheduled", null, "HMC", null, null, null, null, null, "Closed", null, "Aarthi - SX/BD"], [null, null, null, null, null, "Customer Interview Scheduled", null, "ESAB", null, null, null, null, null, "Joined", null, "Santhosh - SG/XC"], [null, null, null, null, null, "Customer Tool Test Scheduled", null, "Motherson Mechanical", null, null, null, null, null, "Offered", null, "Sujith - Non-SDS"], [null, null, null, null, null, "Internal Tool Reject", null, "CIM", null, null, null, null, null, "Cancelled", null, "Sujith-Hardware"], [null, null, null, null, null, "Customer Tool Reject", null, "PRYSM", null, null, null, null, null, "Hold", null, null], [null, null, null, null, null, "Internal Profile Reject", null, "Skoda", null, null, null, null, null, null, null, null], [null, null, null, null, null, "Customer Profile Reject", null, "Wipro", null, null, null, null, null, null, null, null], [null, null, null, null, null, "Customer Interview Reject", null, "Siemens", null, null, null, null, "Minnal", null, "Suganya", null], [null, null, null, null, null, "Internal Interview Reject", null, "Clubcar", null, null, null, null, "Suganya", null, "Roshan", null], [null, null, null, null, null, "Customer Select", null, "Carrier", null, null, null, null, "Usha", null, "Minnal", null], [null, null, null, null, null, "To be offered", null, "Forvia", null, null, null, null, "Roshan", null, "Shobha", null], [null, null, null, null, null, "Offered", null, null, null, null, null, null, "Nikhil", null, "Nikhil", null], [null, null, null, null, null, "Joined", null, null, null, null, null, null, "Shobha", null, "Priyathersene", null], [null, null, null, null, null, "Screen Reject", null, null, null, null, null, null, "Priyathersene", null, "Usha", null], [null, null, null, null, null, "Internal Profile Hold", null, null, null, null, null, null, "Charan", null, "Charan", null], [null, null, null, null, null, "Candidate Drop", null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "Position Hold", null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "Profile Hold", null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "Position Closed", null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "Candidate not interested after sharing", null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "Shared Profile to Customer", null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "Duplicate", null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "Internal Interview in Process", null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "Duplicate from customer end", null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "L1 Interview Feedback Pending", null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "Fulfilled", null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "Customer Interview Feedback pending", null, null, null, null, null, null, null, null, null, null]], "Summary_Bosch": [[null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, "Embedded", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Total Profiles ", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Customer Feedback Pending", null, null, null, "No of Profiles shared", "SOWID", "Customer Feedback Pending", "Internal Feedback Pending", "Internal Tool Test Scheduled", "Customer Interview Scheduled", "Customer Tool Test Scheduled", "Internal Tool Reject", "Customer Tool Reject", "Internal Porfile Reject", "Customer Profile Reject", "Customer Interview Reject", "Internal Interview Reject", "Customer Select", "To be offered", "Offered", "Joined", "Screen Reject", "Internal Profile Hold", "Drop", "Position Hold", "Profile Hold", "Position Closed"], ["Internal Feedback Pending", null, null, null, null, "9677", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Internal Profile Reject", null, null, null, null, "XC", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Customer Profile Reject", null, null, null, null, "7415", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["To be offered", null, null, null, null, "9103", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Offered", null, null, null, null, "9600", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Joined", null, null, null, null, "9048", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Candidate Drop", null, null, null, null, "8877", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Position Hold", null, null, null, null, "9146", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Profile Hold", null, null, null, null, "9191", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Profile Closed", null, null, null, null, "8716", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Candidate not interested after sharing", "1", null, null, null, "8880", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Positions Closed", null, null, null, null, "9611", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9145", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "VM", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9106", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9116", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9209", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9553", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9503", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "W ID", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9249", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9044", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9793", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "6418", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9109", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "4232", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "5294", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9154", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9200", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "BCM", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "8018", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "6371", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "6370", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "8358", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "8984", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "8903", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9871", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9892", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9884", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9064", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9769", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "8462", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9201", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9274", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "8356", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "7466", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9562", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9213", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9190", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "871 ", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9213", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9769", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "815 ", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "W ID", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "245 ", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9503", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "815 ", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "8984", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9190", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "871 ", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "160 ", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9562", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9200", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9121", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9327", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9600", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9116", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "871 ", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9109", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9146", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "8637", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "8627", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9872", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "26_1", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "4380", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9897", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "8847", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9353", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9814", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9106", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "5294", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "ting", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "6418", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9884", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9201", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "10077", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "10139", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "10160", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9504", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9806", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "10143", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9807", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9264", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9958", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "10150", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "294 ", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9472", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "8736", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "10159", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9890", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "472 ", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "10067", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "7629", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9989", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "10239", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "9064", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], [null, null, null, null, null, "", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]], "Recruiter Vise": [[null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Bosch", "Sonali", "Mohammed", "Jayasurya", "Navin", "Annamalai", "Keerthana", "Jagadharshini", "Ajay", "Swetha", "Meenatchi", null, null, null, null], ["Internal Feedback Pending", null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Customer Feedback Pending", null, null, null, null, null, null, null, null, null, null, null, null, null, "Basava"], ["Internal Tool Test Scheduled", null, null, null, null, null, null, null, null, null, null, null, null, null, "Rajesh TMD"], ["Customer Interview Scheduled", null, null, null, null, null, null, null, null, null, null, null, null, null, "Harsha"], ["Customer Tool Test Scheduled", null, null, null, null, null, null, null, null, null, null, null, null, null, "Arthi"], ["Internal Tool Reject", null, null, null, null, null, null, null, null, null, null, null, null, null, "Santhosh"], ["Customer Tool Reject", null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Internal Porfile Reject", null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Customer Profile Reject", null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Customer Interview Reject", null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Internal Interview Reject", null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Customer Select", null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["To be offered", null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Offered", null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Joined", null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Screen Reject", null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Internal Profile Hold", null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Candidate Drop", null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Position Hold", null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Profile Hold", null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Position Closed", null, null, null, null, null, null, null, null, null, null, null, null, null, null], ["Candidate not interested after sharing", null, null, null, null, null, null, null, null, null, null, null, null, null, null]]};
