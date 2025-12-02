export const CONFIG = {
    version: "3.7.1", 
    gameTitle: "Online Voetbal Manager",
    startBudget: 150000,
    currency: "€",
    maxMatchdays: 34,

    costs: {
        stadium: [0, 100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000],
        training: [0, 75000, 150000, 300000, 750000, 1500000, 3000000, 6000000],
        medical:  [0, 50000, 100000, 200000, 500000, 1000000, 2000000, 4000000]
    },

    tactics: {
        neutral: { 
            name: "Neutraal (4-4-2)", 
            desc: "Gebalanceerd. Sterk tegen 4-3-3, zwak tegen 5-3-2.",
            strongAgainst: "attack",
            weakAgainst: "defense",
            attBonus: 0, defBonus: 0 
        },
        attack: { 
            name: "Aanvallend (4-3-3)", 
            desc: "Vol op de aanval. Sterk tegen 5-3-2, zwak tegen 4-4-2.",
            strongAgainst: "defense",
            weakAgainst: "neutral",
            attBonus: 5, defBonus: -5 
        },
        defense: { 
            name: "Verdedigend (5-3-2)", 
            desc: "De bus parkeren. Sterk tegen 4-4-2, zwak tegen 4-3-3.",
            strongAgainst: "neutral",
            weakAgainst: "attack",
            attBonus: -5, defBonus: 5 
        }
    },

    sponsors: {
        local: ["Bakkerij Jansen", "Garage Snel", "Café 't Hoekje", "Slagerij Henk", "Kapsalon Modern", "Visboer Urk", "Schilderbedrijf Kwast"],
        national: ["Jumbo", "Albert Heijn", "Gamma", "Praxis", "Coolblue", "Bol.com", "Hema", "Kruidvat", "MediaMarkt"],
        global: ["Ziggo", "KPN", "Philips", "Heineken", "ASML", "Shell", "ING", "Adidas", "Nike", "Fly Emirates"]
    },
    
    // --- NIEUWE NAMEN DATABASE PER LAND ---
    nations: {
        NL: { 
            flag: "🇳🇱", name: "Nederland",
            first: ["Jan", "Piet", "Klaas", "Luuk", "Daan", "Sem", "Lucas", "Milan", "Levi", "Noah", "Thijs", "Jesse", "Bram", "Tom", "Tim", "Lars", "Finn", "Kevin", "Rico", "Nick", "Xavi", "Joey", "Teun", "Gijs", "Sven", "Stijn", "Koen", "Julian", "Ruben", "Floris", "Jens", "Noud", "Mees", "Guus", "Mats", "Tijn", "Jurren", "Hidde", "Joep", "Ties"],
            last: ["Jansen", "de Vries", "Bakker", "Visser", "Smit", "Meijer", "de Jong", "Mulder", "Groot", "Bos", "Vos", "Peters", "Hendriks", "Dekker", "Brouwer", "Koning", "Maas", "Simons", "Gakpo", "Van Dijk", "De Ligt", "Koopmeiners", "Weghorst", "Klaassen", "Berghuis", "Bergwijn", "Dumfries", "Aké", "Van de Ven", "Frimpong", "Malen", "Brobbey", "Veerman", "Schouten", "Geertruida", "Wieffer", "Bijlow", "Flekken"]
        },
        BE: { 
            flag: "🇧🇪", name: "België",
            first: ["Arthur", "Liam", "Louis", "Noah", "Adam", "Jules", "Lucas", "Victor", "Gabriel", "Eden", "Kevin", "Romelu", "Thibaut", "Yannick", "Dries", "Axel", "Jan", "Toby", "Youri", "Leander", "Amadou", "Jeremy", "Charles", "Lois", "Zeno", "Koen", "Wout", "Hans", "Simon", "Matz", "Sebastiaan", "Timothy"],
            last: ["Peeters", "Janssens", "Maes", "Jacobs", "Mertens", "Willems", "Claes", "Goossens", "De Bruyne", "Lukaku", "Courtois", "Carrasco", "Witsel", "Vertonghen", "Alderweireld", "Tielemans", "Dendoncker", "Onana", "Doku", "De Ketelaere", "Openda", "Castagne", "Meunier", "Faes", "Theate", "Debast", "Vermeeren", "Bakayoko", "Trossard", "Vanaken", "Casteels", "Sels"]
        },
        DE: { 
            flag: "🇩🇪", name: "Duitsland",
            first: ["Hans", "Klaus", "Lukas", "Thomas", "Stefan", "Felix", "Maximilian", "Leon", "Paul", "Elias", "Jonas", "Julian", "Florian", "Jamal", "Leroy", "Joshua", "Manuel", "Marc", "Ilkay", "Toni", "Antonio", "Kai", "Niclas", "Serge", "Timo", "Mats", "Niklas", "Emre", "Benjamin", "Robin", "Kevin", "David", "Bernd"],
            last: ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Hoffmann", "Schäfer", "Neuer", "Kimmich", "Goretzka", "Gündogan", "Kroos", "Rüdiger", "Havertz", "Füllkrug", "Gnabry", "Sané", "Musiala", "Wirtz", "Brandt", "Hummels", "Süle", "Schlotterbeck", "Tah", "Can", "Henrichs", "Raum", "Gosens", "Trapp", "Ter Stegen"]
        },
        EN: { 
            flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", name: "Engeland",
            first: ["Jack", "Harry", "George", "Oliver", "Charlie", "Jacob", "Freddie", "Jude", "Mason", "Declan", "Phil", "Bukayo", "Marcus", "Trent", "Kyle", "John", "Jordan", "Luke", "Kieran", "Ben", "Aaron", "James", "Conor", "Cole", "Ollie", "Ivan", "Jarrod", "Anthony", "Kobbie", "Ezri", "Lewis", "Rico"],
            last: ["Smith", "Jones", "Taylor", "Brown", "Wilson", "Evans", "Walker", "Kane", "Sterling", "Foden", "Bellingham", "Saka", "Rashford", "Alexander-Arnold", "Stones", "Maguire", "Pickford", "Shaw", "Trippier", "Rice", "Grealish", "Maddison", "Gallagher", "Palmer", "Watkins", "Toney", "Bowen", "Gordon", "Mainoo", "Konsa", "Dunk", "Ramsdale"]
        },
        FR: { 
            flag: "🇫🇷", name: "Frankrijk",
            first: ["Kylian", "Antoine", "Hugo", "Louis", "Gabriel", "Léo", "Raphaël", "Maël", "Jules", "Paul", "Ousmane", "Kingsley", "Olivier", "Theo", "Lucas", "Ibrahima", "Dayot", "William", "Eduardo", "Aurelien", "Adrien", "Youssouf", "Randal", "Marcus", "Mike", "Brice", "Alphonse", "Warren", "Bradley", "Moussa", "N'Golo"],
            last: ["Mbappé", "Griezmann", "Pogba", "Giroud", "Dembele", "Hernandez", "Lloris", "Varane", "Kante", "Camavinga", "Tchouameni", "Rabiot", "Fofana", "Kolo Muani", "Thuram", "Maignan", "Samba", "Areola", "Saliba", "Upamecano", "Konaté", "Pavard", "Koundé", "Mendy", "Coman", "Diaby", "Barcola", "Zaïre-Emery", "Benzema", "Zidane", "Henry"]
        },
        ES: { 
            flag: "🇪🇸", name: "Spanje",
            first: ["Sergio", "Pablo", "Gavi", "Pedri", "Ansu", "Ferran", "Unai", "Iker", "Xavi", "Andres", "Alvaro", "Rodri", "Dani", "Aymeric", "Pau", "Alejandro", "Lamine", "Nico", "Mikel", "Alex", "David", "Kepa", "Robert", "Joselu", "Jesus", "Nacho", "Cesar", "Martin", "Yeremy", "Fabian", "Oihan", "Robin"],
            last: ["Garcia", "Rodriguez", "Gonzalez", "Fernandez", "Lopez", "Martinez", "Sanchez", "Perez", "Ramos", "Busquets", "Iniesta", "Morata", "Carvajal", "Laporte", "Torres", "Olmo", "Yamal", "Williams", "Oyarzabal", "Merino", "Raya", "Simon", "Balde", "Gaya", "Azpilicueta", "Navas", "Asensio", "Pino", "Ruiz", "Sancet", "Le Normand", "Cucurella"]
        },
        IT: {
            flag: "🇮🇹", name: "Italië",
            first: ["Gianluigi", "Alessandro", "Federico", "Nicolo", "Marco", "Lorenzo", "Ciro", "Leonardo", "Giorgio", "Francesco", "Davide", "Matteo", "Giovanni", "Giacomo", "Bryan", "Manuel", "Jorginho", "Rafael", "Andrea", "Luca", "Domenico", "Alessio", "Gianluca", "Mattia", "Riccardo", "Salvatore", "Vincenzo", "Stefano", "Antonio", "Michele"],
            last: ["Donnarumma", "Bastoni", "Bonucci", "Chiellini", "Barella", "Verratti", "Chiesa", "Immobile", "Insigne", "Pellegrini", "Locatelli", "Cristante", "Di Lorenzo", "Spinazzola", "Dimarco", "Acerbi", "Mancini", "Buongiorno", "Scalvini", "Frattesi", "Scamacca", "Retegui", "Zaccagni", "El Shaarawy", "Politano", "Berardi", "Vicario", "Meret", "Provedel", "Gatti", "Darmian"]
        },
        PT: { 
            flag: "🇵🇹", name: "Portugal",
            first: ["Cristiano", "Bernardo", "Bruno", "Ruben", "Diogo", "Joao", "Rafael", "Pepe", "Vitinha", "Otavio", "Goncalo", "Antonio", "Nuno", "Danilo", "Matheus", "Pedro", "Rui", "Jose", "Francisco", "Nelson", "Diogo", "Andre", "Ricardo", "Mario", "Tiago", "Miguel", "Luis", "Carlos", "Manuel", "Jorge"],
            last: ["Ronaldo", "Silva", "Fernandes", "Dias", "Jota", "Cancelo", "Leao", "Felix", "Palhinha", "Neves", "Ramos", "Inacio", "Mendes", "Pereira", "Nunes", "Neto", "Patricio", "Costa", "Sa", "Dalot", "Semedo", "Guerreiro", "Horta", "Conceicao", "Mario", "Bruma", "Pote", "Trincao", "Carvalho", "Moutinho", "Guedes"]
        },
        HR: {
            flag: "🇭🇷", name: "Kroatië",
            first: ["Luka", "Ivan", "Mateo", "Marcelo", "Andrej", "Josko", "Dominik", "Mario", "Josip", "Lovro", "Borna", "Domagoj", "Bruno", "Nikola", "Ante", "Marko", "Mislav", "Luka", "Ivica", "Dario", "Stipe", "Vedran", "Dejan", "Sime", "Tin", "Martin", "Nediljko", "Duje", "Kristijan", "Zvonimir"],
            last: ["Modric", "Rakitic", "Kovacic", "Brozovic", "Gvardiol", "Livakovic", "Perisic", "Pasalic", "Kramaric", "Petkovic", "Vlasic", "Sosa", "Juranovic", "Sutalo", "Erlic", "Vida", "Majer", "Ivanusec", "Orsic", "Budimir", "Pjaca", "Labrovic", "Ivusic", "Stanisic", "Pongracic", "Caleta-Car", "Barisic", "Baturina", "Sucic", "Marco-Pasalic"]
        },
        MA: {
            flag: "🇲🇦", name: "Marokko",
            first: ["Hakim", "Achraf", "Noussair", "Sofyan", "Yassine", "Nayef", "Romain", "Azzedine", "Youssef", "Amine", "Bilal", "Ismael", "Abde", "Selim", "Sofiane", "Munir", "Ilias", "Chadi", "Abdel", "Tarik", "Walid", "Jawad", "Karim", "Nordin", "Faycal", "Mehdi", "Brahim", "Oussama", "Anass", "Zakaria"],
            last: ["Ziyech", "Hakimi", "Mazraoui", "Amrabat", "Bounou", "Aguerd", "Saiss", "Ounahi", "En-Nesyri", "Harit", "El Khannouss", "Saibari", "Ezzalzouli", "Amallah", "Boufal", "El Kajoui", "Akhomach", "Riad", "Abqar", "Tissoudali", "Cheddira", "El Kaabi", "Rahimi", "Diaz", "Adli", "Benatia", "Belhanda", "Dirar", "El Ahmadi", "Boussoufa", "Hamdallah"]
        },
        TR: {
            flag: "🇹🇷", name: "Turkije",
            first: ["Hakan", "Arda", "Orkun", "Kerem", "Ferdi", "Merih", "Caglar", "Zeki", "Baris", "Ismail", "Salih", "Kenan", "Yusuf", "Semih", "Mert", "Ugurcan", "Altay", "Abdülkerim", "Kaan", "Cenk", "Enes", "Bertug", "Ridvan", "Ozan", "Samet", "Eren", "Okay", "Yunus", "Irfan", "Cengiz"],
            last: ["Calhanoglu", "Güler", "Kökcü", "Aktürkoglu", "Kadioglu", "Demiral", "Söyüncü", "Celik", "Yilmaz", "Yüksek", "Özcan", "Yildiz", "Yazici", "Kilicsoy", "Günok", "Cakir", "Bayindir", "Bardakci", "Ayhan", "Tosun", "Ünal", "Yildirim", "Elmali", "Kabak", "Akaydin", "Elmali", "Yokuslu", "Akgün", "Can Kahveci", "Ünder", "Müldür"]
        }
    },

    positions: ["DM", "VL", "CV", "VR", "VVM", "CM", "CAM", "LB", "SP", "RB"],
    
    realLeagues: {
        1: ["PSV", "Feyenoord", "FC Twente", "AZ", "Ajax", "NEC", "FC Utrecht", "Sparta Rotterdam", "Go Ahead Eagles", "Fortuna Sittard", "sc Heerenveen", "PEC Zwolle", "Almere City FC", "Heracles Almelo", "RKC Waalwijk", "Willem II", "FC Groningen", "NAC Breda"],
        2: ["Excelsior", "FC Volendam", "Vitesse", "ADO Den Haag", "Roda JC", "FC Dordrecht", "De Graafschap", "FC Emmen", "SC Cambuur", "VVV-Venlo", "MVV Maastricht", "Helmond Sport", "Telstar", "TOP Oss", "FC Den Bosch", "FC Eindhoven", "Jong Ajax", "Jong PSV", "Jong AZ", "Jong FC Utrecht"]
    },
    cities: ["Amsterdam", "Rotterdam", "Utrecht", "Eindhoven", "Groningen", "Tilburg", "Breda", "Zwolle", "Leiden", "Maastricht", "Dordrecht", "Emmen", "Venlo", "Almere", "Haarlem", "Apeldoorn", "Amersfoort", "Hengelo", "Assen", "Middelburg"],
    suffixes: ["FC", "United", "City", "Boys", "'04", "SV", "Rangers", "Stars", "Quick", "Boys", "Wanderers", "Rovers"]
};