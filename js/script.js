let charts = [];

function processarCSV(texto) {
  const linhas = texto.trim().split("\n");
  const dados = linhas.slice(1).map(l => l.split(";"));

  let clientes = {};
  
  dados.forEach(l => {
    const ano = l[0].trim();
    const cliente = l[1].trim();
    const os = parseInt(l[2]) || 0;
    if (!clientes[cliente]) clientes[cliente] = {2024:0, 2025:0};
    clientes[cliente][ano] += os;
  });

  let total2024=0, total2025=0, retidos=0, perdidos=0, novos=0;
  let ranking = [];
  let variacoes = [];

  let tbody = document.querySelector("#tabela tbody");
  tbody.innerHTML = "";

  Object.keys(clientes).forEach(cliente => {
    let a2024 = clientes[cliente][2024] || 0;
    let a2025 = clientes[cliente][2025] || 0;
    let variacao = a2025 - a2024;

    if (a2024>0) total2024++;
    if (a2025>0) total2025++;

    let status="", classe="";
    if (a2024>0 && a2025>0){status="Retido";classe="status-retido";retidos++;}
    else if (a2024>0 && a2025===0){status="Perdido";classe="status-perdido";perdidos++;}
    else if (a2024===0 && a2025>0){status="Novo";classe="status-novo";novos++;}

    ranking.push({cliente, total:a2024+a2025});
    variacoes.push({cliente, variacao});

    let tr=document.createElement("tr");
    tr.innerHTML=`<td>${cliente}</td><td>${a2024}</td><td>${a2025}</td><td>${variacao}</td><td class="${classe}">${status}</td>`;
    tbody.appendChild(tr);
  });

  ranking.sort((a,b)=>b.total-a.total);
  variacoes.sort((a,b)=>b.variacao-a.variacao);

  let churn = total2024>0 ? ((perdidos/total2024)*100).toFixed(1) : 0;

  document.getElementById("k2024").innerText=total2024;
  document.getElementById("k2025").innerText=total2025;
  document.getElementById("kRetidos").innerText=retidos;
  document.getElementById("kPerdidos").innerText=perdidos;
  document.getElementById("kNovos").innerText=novos;
  document.getElementById("kChurn").innerText=churn+"%";

  gerarInsights(total2024,total2025,retidos,perdidos,novos,churn);

  charts.forEach(c=>c.destroy());
  charts=[];

  charts.push(new Chart(chartDonut,{
    type:"doughnut",
    data:{
      labels:["Retidos","Perdidos","Novos"],
      datasets:[{data:[retidos,perdidos,novos],backgroundColor:["#27ae60","#c0392b","#2980b9"]}]
    }
  }));

  charts.push(new Chart(chartLinha,{
    type:"line",
    data:{
      labels:["2024","2025"],
      datasets:[{label:"Clientes ativos",data:[total2024,total2025],borderColor:"#0b2e59",tension:.3}]
    }
  }));

  charts.push(new Chart(chartRanking,{
    type:"bar",
    data:{
      labels:ranking.slice(0,10).map(r=>r.cliente),
      datasets:[{label:"Total OS",data:ranking.slice(0,10).map(r=>r.total),backgroundColor:"#1f4e79"}]
    }
  }));

  charts.push(new Chart(chartVariacao,{
    type:"bar",
    data:{
      labels:variacoes.slice(0,10).map(v=>v.cliente),
      datasets:[{label:"Variação OS",data:variacoes.slice(0,10).map(v=>v.variacao),backgroundColor:"#f39c12"}]
    }
  }));
}

function gerarInsights(t24,t25,r,p,n,churn){
  let html="";
  html+=`• A empresa possuía <b>${t24}</b> clientes em 2024 e <b>${t25}</b> em 2025.<br>`;
  html+=`• Foram retidos <b>${r}</b> clientes e perdidos <b>${p}</b>.<br>`;
  html+=`• A taxa de churn foi de <b>${churn}%</b>.<br>`;
  html+=`• Entraram <b>${n}</b> novos clientes.<br>`;
  html+=`• Crescimento líquido da base: <b>${t25-t24}</b> clientes.<br>`;
  if(churn>50) html+=`⚠️ <b>Alerta:</b> churn elevado — risco de instabilidade na carteira.<br>`;
  if(t25>t24) html+=`✅ A base cresceu, porém com forte dependência de novos clientes.<br>`;
  document.getElementById("insights").innerHTML=html;
}

document.getElementById("fileInput").addEventListener("change",function(e){
  const reader=new FileReader();
  reader.onload=(evt)=>processarCSV(evt.target.result);
  reader.readAsText(e.target.files[0],"ISO-8859-1");
});