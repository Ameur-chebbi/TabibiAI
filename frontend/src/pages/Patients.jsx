import { useEffect, useMemo, useState } from "react";



import {
  CalendarDays,
  MessageCircle,
  Plus,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { supabase } from "../supabase";
import Sidebar from "../components/Sidebar";
import "./Patients.css";

function getInitials(name = "") {

  return name
    .split(" ")
    .map((word)=>word[0])
    .slice(0,2)
    .join("")
    .toUpperCase();

}



function Patients(){

const [patientAppointments,setPatientAppointments] = useState([]);

const [patientConversations,setPatientConversations] = useState([]);
const [selectedPatient,setSelectedPatient] = useState(null);
const [activeTab,setActiveTab] = useState("Informations");

const [patientNotes,setPatientNotes] = useState([]);
const [newNote,setNewNote] = useState("");
const [patients,setPatients] = useState([]);

const [searchValue,setSearchValue] = useState("");

const [languageFilter,setLanguageFilter] = useState("Toutes les langues");

const [sourceFilter,setSourceFilter] = useState("Toutes les sources");

const [statusFilter,setStatusFilter] = useState("Tous les statuts");


const [showAddModal,setShowAddModal] = useState(false);

const [newPatient,setNewPatient] = useState({

name:"",
phone:"",
email:"",
language:"Français",
source:"Manuel",
bloodGroup:""

});
async function openPatient(patient){

  setSelectedPatient(patient);
  setActiveTab("Informations");
  setPatientNotes([]);
  setNewNote("");


  // rendez vous
  const {data:appointments, error:appointmentsError}=await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", patient.id)
    .order("date", {ascending:true});


  if(appointmentsError){
    console.log(appointmentsError);
  }else{
    setPatientAppointments(appointments || []);
  }



  // conversations
  const {data:conversations, error:conversationsError}=await supabase
    .from("conversations")
    .select("*")
    .eq("patient_id", patient.id)
    .order("created_at", {ascending:true});


  if(conversationsError){
    console.log(conversationsError);
  }else{
    setPatientConversations(conversations || []);
  }


  // notes
  const {data:notes, error:notesError}=await supabase
    .from("notes")
    .select("*")
    .eq("patient_id", patient.id)
    .order("created_at", {ascending:false});


  if(notesError){
    console.log(notesError);
  }else{
    setPatientNotes(notes || []);
  }

}

async function handleSaveNote(){

  if(!selectedPatient || !newNote.trim()) return;

  const {error}=await supabase
    .from("notes")
    .insert([
      {
        patient_id:selectedPatient.id,
        content:newNote.trim()
      }
    ]);

  if(error){
    console.log(error);
    return;
  }

  setNewNote("");

  const {data:notes, error:notesError}=await supabase
    .from("notes")
    .select("*")
    .eq("patient_id", selectedPatient.id)
    .order("created_at", {ascending:false});

  if(notesError){
    console.log(notesError);
  }else{
    setPatientNotes(notes || []);
  }

}

async function handleDeleteNote(noteId){

  const {error}=await supabase
    .from("notes")
    .delete()
    .eq("id", noteId);

  if(error){
    console.log(error);
    return;
  }

  setPatientNotes((current)=>current.filter((note)=>note.id !== noteId));

}




// =========================
// GET PATIENTS
// =========================

useEffect(()=>{

fetchPatients();

},[]);




async function fetchPatients(){


const {data,error}=await supabase

.from("patients")

.select("*")

.order(
"created_at",
{
ascending:false
}
);



if(error){

console.log(error);

return;

}




const formattedPatients = data.map((patient)=>({

...patient,


bloodGroup:
patient.blood_group || "Non renseigné",


conversationsCount:0,


appointmentsCount:0,


lastContact:"Aujourd'hui"


}));


setPatients(formattedPatients);


}





// =========================
// FILTER
// =========================


const filteredPatients = useMemo(()=>{


return patients.filter((patient)=>{


const search =
searchValue.toLowerCase();



const matchSearch =

patient.name?.toLowerCase().includes(search)

||

patient.phone?.includes(search)

||

patient.email?.toLowerCase().includes(search);



const matchLanguage =

languageFilter==="Toutes les langues"

||

patient.language===languageFilter;



const matchSource =

sourceFilter==="Toutes les sources"

||

patient.source===sourceFilter;



const matchStatus =

statusFilter==="Tous les statuts"

||

patient.status===statusFilter;



return (

matchSearch

&&

matchLanguage

&&

matchSource

&&

matchStatus

);


});


},[
patients,
searchValue,
languageFilter,
sourceFilter,
statusFilter
]);






// =========================
// STATS
// =========================


const stats = {


total:patients.length,


active:

patients.filter(
p=>p.status==="Actif"
).length,


whatsapp:

patients.filter(
p=>p.source==="WhatsApp"
).length,


appointments:

patients.reduce(
(sum,p)=>
sum+p.appointmentsCount,
0
)


};







// =========================
// ADD PATIENT
// =========================


async function handleAddPatient(e){


e.preventDefault();



const {data,error}=await supabase

.from("patients")

.insert([

{

name:newPatient.name,

phone:newPatient.phone,

email:newPatient.email,

language:newPatient.language,

source:newPatient.source,

blood_group:newPatient.bloodGroup,

status:"Actif"

}

])

.select();



if(error){

console.log(
"SUPABASE ERROR:",
error
);

return;

}





const patient={


...data[0],


bloodGroup:
data[0].blood_group,


conversationsCount:0,


appointmentsCount:0,


lastContact:"À l'instant"


};




setPatients(
(current)=>[
patient,
...current
]
);



setShowAddModal(false);



setNewPatient({

name:"",
phone:"",
email:"",
language:"Français",
source:"Manuel",
bloodGroup:""

});


}
return (

<div className="patients-page-layout">


<Sidebar />


<main className="patients-main-content">



<header className="patients-header">


<div>

<h1>
Patients
</h1>


<p>
Consultez les informations, les conversations et les rendez-vous de vos patients.
</p>


</div>



<button

className="add-patient-button"

onClick={()=>setShowAddModal(true)}

>

<Plus size={19}/>

Ajouter un patient

</button>



</header>







<section className="patients-stats">


<div className="patient-stat-card">

<Users/>

<div>

<span>
Total patients
</span>


<strong>
{stats.total}
</strong>

</div>

</div>




<div className="patient-stat-card">

<UserRound/>

<div>

<span>
Patients actifs
</span>


<strong>
{stats.active}
</strong>


</div>

</div>





<div className="patient-stat-card">

<MessageCircle/>

<div>

<span>
Depuis WhatsApp
</span>


<strong>
{stats.whatsapp}
</strong>


</div>

</div>





<div className="patient-stat-card">

<CalendarDays/>

<div>

<span>
Rendez-vous
</span>


<strong>
{stats.appointments}
</strong>


</div>

</div>



</section>









<section className="patients-card">



<div className="patients-toolbar">



<div className="patients-search">


<Search size={18}/>


<input

placeholder="Rechercher par nom, téléphone ou email..."

value={searchValue}

onChange={(e)=>setSearchValue(e.target.value)}

/>


</div>





<select

value={languageFilter}

onChange={(e)=>setLanguageFilter(e.target.value)}

>

<option>
Toutes les langues
</option>

<option>
Français
</option>

<option>
English
</option>

<option>
العربية
</option>


</select>






<select

value={sourceFilter}

onChange={(e)=>setSourceFilter(e.target.value)}

>

<option>
Toutes les sources
</option>

<option>
WhatsApp
</option>

<option>
Manuel
</option>


</select>






<select

value={statusFilter}

onChange={(e)=>setStatusFilter(e.target.value)}

>

<option>
Tous les statuts
</option>


<option>
Actif
</option>


<option>
Inactif
</option>


</select>




</div>








<div className="patients-table-wrapper">


<table className="patients-table">


<thead>

<tr>

<th>
Patient
</th>

<th>
Langue
</th>

<th>
Source
</th>

<th>
Conversations
</th>

<th>
Rendez-vous
</th>

<th>
Dernier contact
</th>

<th>
Statut
</th>

<th>
Profil
</th>


</tr>

</thead>





<tbody>


{
filteredPatients.map((patient)=>(


<tr key={patient.id}>


<td>


<div className="patient-identity">


<div className="patient-avatar">

{getInitials(patient.name)}

</div>



<div>

<b>
{patient.name}
</b>


<small>
{patient.phone}
</small>


</div>



</div>


</td>





<td>

{patient.language}

</td>




<td>

{patient.source}

</td>





<td>

{patient.conversationsCount}

</td>





<td>

{patient.appointmentsCount}

</td>





<td>

{patient.lastContact}

</td>





<td>


<span

className={`patient-status ${patient.status?.toLowerCase()}`}

>

{patient.status}

</span>


</td>





<td>


<button

className="view-patient-button"

onClick={() => openPatient(patient)}

>
Voir
</button>


</td>




</tr>


))

}



</tbody>


</table>


</div>




</section>









{/* PROFILE */}


{
selectedPatient && (

<div className="patient-drawer-overlay"

onClick={()=>setSelectedPatient(null)}
>


<div

className="patient-drawer"

onClick={(e)=>e.stopPropagation()}

>



<div className="drawer-header">


<div className="drawer-avatar">

{getInitials(selectedPatient.name)}

</div>


<div>

<h2>
{selectedPatient.name}
</h2>


<p>
{selectedPatient.phone}
</p>


<p>
{selectedPatient.email}
</p>


</div>



<button

className="drawer-close"

onClick={()=>setSelectedPatient(null)}

>

<X size={24}/>

</button>



</div>






<div className="drawer-tags">


<span className="tag language">

{selectedPatient.language}

</span>


<span className="tag whatsapp">

{selectedPatient.source}

</span>



<span className="tag active">

{selectedPatient.status}

</span>


</div>







<div className="drawer-tabs">

<button

className={
activeTab==="Informations"
?"active-tab":""
}

onClick={()=>setActiveTab("Informations")}

>
Informations
</button>



<button

className={
activeTab==="Rendez-vous"
?"active-tab":""
}

onClick={()=>setActiveTab("Rendez-vous")}

>
Rendez-vous
</button>



<button

className={
activeTab==="Conversations"
?"active-tab":""
}

onClick={()=>setActiveTab("Conversations")}

>
Conversations
</button>



<button

className={
activeTab==="Notes"
?"active-tab":""
}

onClick={()=>setActiveTab("Notes")}

>
Notes
</button>



</div>

<div className="drawer-content">

{activeTab==="Informations" && (

<div className="patient-info-grid">

  <div className="info-card">
    <span>Groupe sanguin</span>
    <strong>{selectedPatient.blood_group}</strong>
  </div>

  <div className="info-card">
    <span>Langue</span>
    <strong>{selectedPatient.language}</strong>
  </div>

  <div className="info-card">
    <span>Source</span>
    <strong>{selectedPatient.source}</strong>
  </div>

  <div className="info-card">
    <span>Téléphone</span>
    <strong>{selectedPatient.phone}</strong>
  </div>

  <div className="info-card">
    <span>Email</span>
    <strong>{selectedPatient.email}</strong>
  </div>

  <div className="info-card">
    <span>Nombre de conversations</span>
    <strong>{patientConversations.length}</strong>
  </div>

  <div className="info-card">
    <span>Nombre de rendez-vous</span>
    <strong>{patientAppointments.length}</strong>
  </div>

</div>

)}


{
activeTab==="Rendez-vous" && (

<div className="appointment-container">

{
patientAppointments.length === 0 ? (

<div className="appointment-empty-state">
<p>Aucun rendez-vous</p>
</div>

) : (

patientAppointments.map((rdv)=>(

<div className="appointment-card" key={rdv.id}>

<div className="appointment-card-header">
<strong>{rdv.reason || "Non renseigné"}</strong>
<span className={`appointment-status ${String(rdv.status || "").toLowerCase().replace(/\s+/g, "-")}`}>
{rdv.status || "En attente"}
</span>
</div>

<div className="appointment-details">
<div>
<span>📅</span>
<strong>{rdv.date || "Non renseignée"}</strong>
</div>
<div>
<span>🕒</span>
<strong>{rdv.time || "Non renseignée"}</strong>
</div>
</div>

</div>

))

)
}

</div>

)
}

{
activeTab==="Notes" && (

<div className="notes-container">

<div className="note-input-section">
<h4>Nouvelle note</h4>
<textarea
className="notes-textarea"
value={newNote}
onChange={(e)=>setNewNote(e.target.value)}
placeholder="Saisissez une note médicale..."
/>
<button type="button" className="save-note-button" onClick={handleSaveNote}>
Enregistrer
</button>
</div>

{
patientNotes.length === 0 ? (

<div className="note-empty-state">
<p>Aucune note</p>
</div>

) : (

<div className="notes-list">
{patientNotes.map((note)=>(
<div className="note-card" key={note.id}>
<p>{note.content}</p>
<div className="note-card-footer">
<span>
{note.created_at ? new Date(note.created_at).toLocaleString("fr-FR", {dateStyle:"medium", timeStyle:"short"}) : ""}
</span>
<button type="button" className="delete-note-button" onClick={()=>handleDeleteNote(note.id)}>
Supprimer
</button>
</div>
</div>
))}
</div>

)
}

</div>

)
}

{
activeTab==="Conversations" && (

<div className="conversation-container">

{
patientConversations.length === 0 ? (

<div className="conversation-empty-state">
<p>Aucune conversation</p>
</div>

) : (

patientConversations.map((conv)=>{

const isPatientMessage = String(conv.sender || "").toLowerCase() === "patient";

return (

<div
key={conv.id}
className={`conversation-bubble ${isPatientMessage ? "patient-msg" : "doctor-msg"}`}
>

<div className="conversation-meta">
<span className="conversation-sender">{conv.sender || "Conversation"}</span>
<span className="conversation-time">
{conv.created_at ? new Date(conv.created_at).toLocaleString("fr-FR", {dateStyle:"medium", timeStyle:"short"}) : ""}
</span>
</div>

<p>{conv.message || ""}</p>

</div>

);

})

)
}

</div>

)
}



</div>






</div>


</div>

)
}










{/* ADD MODAL */}



{
showAddModal &&

<div className="patient-modal-overlay">


<div className="patient-modal">



<div className="patient-modal-header">


<h2>
Ajouter un patient
</h2>



<button

onClick={()=>setShowAddModal(false)}

>

<X/>

</button>



</div>








<form

className="patient-modal-form"

onSubmit={handleAddPatient}

>




<div className="patient-form-row">



<div className="patient-form-group">


<label>
Nom
</label>


<input

required

value={newPatient.name}

onChange={(e)=>
setNewPatient({
...newPatient,
name:e.target.value
})
}

/>


</div>





<div className="patient-form-group">


<label>
Téléphone
</label>


<input

required

value={newPatient.phone}

onChange={(e)=>
setNewPatient({
...newPatient,
phone:e.target.value
})
}

/>


</div>




</div>








<div className="patient-form-row">



<div className="patient-form-group">


<label>
Email
</label>


<input

value={newPatient.email}

onChange={(e)=>
setNewPatient({
...newPatient,
email:e.target.value
})
}

/>


</div>







<div className="patient-form-group">


<label>
Langue
</label>


<select

value={newPatient.language}

onChange={(e)=>
setNewPatient({
...newPatient,
language:e.target.value
})
}

>


<option>
Français
</option>


<option>
English
</option>


<option>
العربية
</option>



</select>



</div>





</div>









<div className="patient-form-row">



<div className="patient-form-group">


<label>
Source
</label>


<select

value={newPatient.source}

onChange={(e)=>
setNewPatient({
...newPatient,
source:e.target.value
})
}

>


<option>
Manuel
</option>


<option>
WhatsApp
</option>


</select>



</div>






<div className="patient-form-group">


<label>
Groupe sanguin
</label>


<input

placeholder="Ex: A+"

value={newPatient.bloodGroup}

onChange={(e)=>
setNewPatient({
...newPatient,
bloodGroup:e.target.value
})
}

/>



</div>





</div>









<div className="patient-modal-actions">



<button

type="button"

className="patient-cancel-button"

onClick={()=>setShowAddModal(false)}

>

Annuler

</button>






<button

type="submit"

className="patient-submit-button"

>

Ajouter

</button>




</div>





</form>




</div>


</div>


}



</main>


</div>


);


}

export default Patients;