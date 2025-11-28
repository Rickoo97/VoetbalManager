export const CONFIG = {
    version: "3.6.1",
    gameTitle: "Online Voetbal Manager",
    startBudget: 300000,
    currency: "€",
    maxMatchdays: 34,

    costs: {
        stadium: [0, 100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000],
        training: [0, 75000, 150000, 300000, 750000, 1500000, 3000000, 6000000],
        medical:  [0, 50000, 100000, 200000, 500000, 1000000, 2000000, 4000000]
    },

    tactics: {
        neutral: { name: "Neutraal (4-4-2)", attBonus: 0, defBonus: 0, desc: "Gebalanceerde speelstijl." },
        attack:  { name: "Aanvallend (4-3-3)", attBonus: 5, defBonus: -5, desc: "Scoor meer, maar geef meer weg." },
        defense: { name: "Verdedigend (5-3-2)", attBonus: -5, defBonus: 5, desc: "Parkeer de bus. Minder tegengoals." }
    },

    sponsors: {
        local: ["Bakkerij Jansen", "Garage Snel", "Café 't Hoekje", "Slagerij Henk", "Kapsalon Modern"],
        national: ["Jumbo", "Albert Heijn", "Gamma", "Praxis", "Coolblue", "Bol.com"],
        global: ["Ziggo", "KPN", "Philips", "Heineken", "ASML", "Shell", "ING"]
    },
    
    firstNames: ["Jan", "Piet", "Klaas", "Luuk", "Daan", "Sem", "Lucas", "Milan", "Levi", "Noah", "Thijs", "Jesse", "Bram", "Tom", "Tim", "Lars", "Finn", "Kevin", "Rico", "Nick", "Xavi", "Mo", "Denzel"],
    lastNames:  ["Jansen", "de Vries", "Bakker", "Visser", "Smit", "Meijer", "de Jong", "Mulder", "Groot", "Bos", "Vos", "Peters", "Hendriks", "Dekker", "Brouwer", "Koning", "Maas", "Simons", "Gakpo"],
    positions: ["DM", "VL", "CV", "VR", "VVM", "CM", "CAM", "LB", "SP", "RB"],
    
    realLeagues: {
        1: ["PSV", "Feyenoord", "FC Twente", "AZ", "Ajax", "NEC", "FC Utrecht", "Sparta Rotterdam", "Go Ahead Eagles", "Fortuna Sittard", "sc Heerenveen", "PEC Zwolle", "Almere City FC", "Heracles Almelo", "RKC Waalwijk", "Willem II", "FC Groningen", "NAC Breda"],
        2: ["Excelsior", "FC Volendam", "Vitesse", "ADO Den Haag", "Roda JC", "FC Dordrecht", "De Graafschap", "FC Emmen", "SC Cambuur", "VVV-Venlo", "MVV Maastricht", "Helmond Sport", "Telstar", "TOP Oss", "FC Den Bosch", "FC Eindhoven", "Jong Ajax", "Jong PSV", "Jong AZ", "Jong FC Utrecht"]
    },
    cities: ["Amsterdam", "Rotterdam", "Utrecht", "Eindhoven", "Groningen", "Tilburg", "Breda", "Zwolle", "Leiden", "Maastricht", "Dordrecht", "Emmen", "Venlo"],
    suffixes: ["FC", "United", "City", "Boys", "'04", "SV", "Rangers", "Stars"]
};