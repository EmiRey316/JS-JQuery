//
//              SISTEMA DE SIMULACIÓN DE PRÉSTAMOS
//
//  2 tipo de préstamos habilitados:
//  
//  - Préstamo Simple: Préstamo en que el capital solicitado se divide en partes iguales en todas las cuotas.
//                      Además se paga el interés correspondiente a cada mensualidad.
//                      En las primeras cuotas se paga más y en las útimas menos.
//
//  - Loan Americano: Préstamo en que el capital solicitado se paga en su totalidad en la últimacuota y en el
//                         resto solo se pagan intereses, por ello la última cuota es muy superior a las demás.
//



/**************************************************************
*                          CLASES
**************************************************************/

//Creo la clase global Loan, que contiene los parámetros y métodos generales de todos los tipos de préstamos.
class lending {
    constructor (id, productType, amount, term) {
        this.id = id;
        this.productType = productType;
        this.amount = amount;
        this.term = term;
        this.quotas = [];
        this.totalPayment = 0;
    }


    interest(capital, anualRate) {
        return (capital * (anualRate / 12)) / 100;
    }

    //Método para guardar las cuotas en el array de colección.
    saveFee(feeValue) {
        this.quotas.push(feeValue);
    }
}


//Creo la clase simpleLending como subclase de Loan.
class simpleLending extends lending {

    loadFees() {
        //Defino la variable balance, como el saldo de capital que falta pagar.
        let balance = this.amount;

        let monthlyPayment = this.amount / this.term;

        //Ciclo que calcula y carga en la colección el valor de cada cuota. Además va sumando el totalPayment.
        for (let i = 1; i <= this.term; i++) {
            let feeInterest = this.interest(balance, anualRateSimple);
            let feeValue = monthlyPayment + feeInterest;
            this.totalPayment = this.totalPayment + feeValue;

            this.saveFee(feeValue);
            
            //Actualizo el saldo.
            balance = balance - monthlyPayment;
        }
    }
}


//Creo la clase LoanAmericano como subclase de Loan.
class americanLending extends lending {

    loadFees() {
        let monthlyInterest = this.interest(this.amount, anualRateAmerican);

        //Las primeras cuotas únicamente tienen interés, las cargo con este ciclo.
        for (let i = 1; i < this.term; i++) {
            this.saveFee(monthlyInterest);
        }

        //Calculo la cuota final y la guardo.
        let finalFee = monthlyInterest + this.amount;
        this.saveFee(finalFee);

        //En este caso, el pago total es el monto solicitado sumado al interes pagado en todas las cuotas. Lo cálculo y transformo.
        this.totalPayment = this.amount + (monthlyInterest * this.term);
    }
}



/**************************************************************
*                    CONSTANTES Y VARIABLES
**************************************************************/

const anualRateSimple = 40;
const anualRateAmerican = 50;



/**************************************************************
*                          FUNCIONES
**************************************************************/

//Función para transformar un valor númerico en formato de moneda.
const valueToCurrency = (value) => {
    return new Intl.NumberFormat('es-UY', {style: 'currency',currency: 'UYU', minimumFractionDigits: 2}).format(value);
}


//Función para cargar y guardar en storage los datos de un préstamo.
const saveLoan = (e) => {
    //Variable para guardar el último ID creado y cargado en el storage.
    let lastID = 0;

    //Creo la variable que será utilizada para crear el objeto préstamo según el tipo y el array que los contendrá.
    let loan;
    let loanCollection = [];

    //Si ya existe un historial de préstamos en el storage, traigo el ID del último elemento y el array. Con esto me aseguro de no repetir ID.
    if ((JSON.parse(localStorage.getItem("loans")) == null) || (JSON.parse(localStorage.getItem("loans")).length == 0)) {
        lastID = 0;
    } else {
        loanCollection = JSON.parse(localStorage.getItem("loans"));
        lastID = loanCollection[loanCollection.length - 1].id;
    }

    let amount = Number($("#amountSlider").val());
    let term = Number($("#termSlider").val());
    
    //Primero creo el objeto con la clase correspondiente al tipo de producto, usando roro.
    switch ($(`#productType`).val()) {
        case "simple":
            loan = new simpleLending(lastID + 1, "Simple", amount, term);
            break;
    
        default:
            loan = new americanLending(lastID + 1, "Americano", amount, term);
    }


    //Genero las cuotas y el pago total del préstamo.
    loan.loadFees();

    //Guardo el nuevo préstamo en el storage.
    loanCollection.push(loan);
    localStorage.setItem("loans", JSON.stringify(loanCollection));

    //Ejecuto la función para mostrar los resultados al salvar.
    showResults(loan);
}


//Muestro el resultado de la solicitud de préstamo, con JQuery.
const showResults = (loan) => {
    $("#showAmount").text(valueToCurrency(loan.amount));
    $("#showTerm").text(`${loan.term} cuotas`);
    $("#showFee").text(valueToCurrency(loan.quotas[0]));
    $("#showTotalPayment").text(valueToCurrency(loan.totalPayment));

    //Datos mostrados según tipo de préstamo.
    switch (loan.productType) {
        case "Simple":
            $("#showProductType").text("Simple");
            $("#showTEA").text(`${anualRateSimple} %`);
            break;
    
        default:
            $("#showProductType").text("Americano");
            $("#showTEA").text(`${anualRateAmerican} %`);
    }
}


//Creación de tabla con el historial de préstamos guardados en storage.
const loansTableCreate = () => {

    let loanCollection = JSON.parse(localStorage.getItem("loans"));
    
    //Creando cada fila de la tabla por cada loan del historial.
    if (loanCollection == null || loanCollection.length == 0) {
        $("#sectionTable").append(`
            <p class="text-center">Vacío</p>
        `);
    } else {
        loanCollection.forEach(e => {
            $("#loansTableBody").prepend(`
                <tr>
                    <th scope="row">${e.id}</th>
                    <td>${e.productType}</td>
                    <td>${valueToCurrency(e.amount)}</td>
                    <td>${e.term}</td>
                    <td>
                        <button data-bs-toggle="modal" data-bs-target="#amortizationModal" onclick="viewLoan(${e.id})">
                            <img src="multimedia/view.png" alt="View button">
                        </button>
                        <button onclick="deleteLoan(${e.id})">
                            <img src="multimedia/delete.png" alt="Delete button">
                        </button>
                    </td>
                </tr>
            `);
        })
    }
}


//Función para borrar del historial un préstamo concreto.
const deleteLoan = (id) => {
    let loanCollection = JSON.parse(localStorage.getItem("loans"));
    let actualizedLoanCollection = loanCollection.filter(e => e.id != id);
    localStorage.setItem("loans", JSON.stringify(actualizedLoanCollection));
    location.reload();
}


//Función para ver más detalles de un préstamo concreto. Se mostrará en un modal.
const viewLoan = (id) => {
    let loanCollection = JSON.parse(localStorage.getItem("loans"));
    let loanToview = loanCollection.find(e => e.id == id);
    //Primero borro la información que pudiese haber quedado.
    $("#amortizationTableBody").text("");

    let amortizationFees = loanToview.quotas;

    //Creo la tabla que mostrará las cuotas del préstamo.
    amortizationFees.forEach(e => {
        $("#amortizationTableBody").append(`
            <tr>
                <th scope="row">${amortizationFees.indexOf(e) + 1}</th>
                <td>${valueToCurrency(e)}</td>
            </tr>
        `);
    })
}



/**************************************************************
*                          EJECUCIÓN
**************************************************************/

//Valor inicial y evento para mostrar el valor del slider del monto a medida que cambia.
$(`#amountValueDisplay`).text($(`#amountSlider`).val());
$(`#amountSlider`).on(`input`,() => {
    $(`#amountValueDisplay`).text($(`#amountSlider`).val());
})

//Valor inicial y evento para mostrar el valor del slider del plazo a medida que cambia.
$(`#termValueDisplay`).text($(`#termSlider`).val());
$(`#termSlider`).on(`input`,() => {
    $(`#termValueDisplay`).text($(`#termSlider`).val());
})

//Al enviar el formulario se guarda el préstamo y se muestran los resultados.
$("#simulatorForm").on("submit", (e) => { 
    e.preventDefault();
    saveLoan();
});


//Creación de la tabla de la página "Préstamos"
loansTableCreate();