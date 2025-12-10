import { useState } from "react";
import { Search, Hash, Shield, Users, UserPlus, ArrowLeft } from "lucide-react";

interface ClassData {
  id: string;
  name: string;
  code: string;
  description: string;
  emblem: string;
  members: string[];
}

interface Friend {
  id: string;
  name: string;
  email: string;
  memberSince: string;
  exercisesCompleted: number;
  level: string;
}

interface FriendRequest {
  id: string;
  from: string;
  fromId: string;
}

export function ClassesPage() {
  // Liste des classes rejointes par l'utilisateur
  const [joinedClasses, setJoinedClasses] = useState<ClassData[]>([
    {
      id: "1",
      name: "Les Mathématiciens",
      code: "#AB12CD34",
      description: "Groupe d'entraide pour réviser les mathématiques du bac. Objectif: excellence !",
      emblem: "🦁",
      members: ["GOTAGA", "MathPro2024", "Einstein42", "CalculGenius", "IntegralMaster"],
    },
  ]);

  // Liste de toutes les classes disponibles
  const [allClasses] = useState<ClassData[]>([
    {
      id: "1",
      name: "Les Mathématiciens",
      code: "#AB12CD34",
      description: "Groupe d'entraide pour réviser les mathématiques du bac. Objectif: excellence !",
      emblem: "🦁",
      members: ["GOTAGA", "MathPro2024", "Einstein42", "CalculGenius", "IntegralMaster"],
    },
    {
      id: "2",
      name: "Terminale S Elite",
      code: "#XY56ZW78",
      description: "Les meilleurs élèves de terminale S se regroupent ici pour viser 20/20",
      emblem: "🎓",
      members: ["ProMaths", "ScienceKing", "FormulaQueen"],
    },
    {
      id: "3",
      name: "BAC 2025",
      code: "#QW90ER12",
      description: "Tous ensemble pour réussir le bac 2025 !",
      emblem: "🚀",
      members: ["Student1", "Learner2", "MathLover3", "Geek4"],
    },
    {
      id: "4",
      name: "Les Dérivés",
      code: "#AS34DF56",
      description: "Spécialisés dans les dérivées et les fonctions exponentielles",
      emblem: "📈",
      members: ["DeriveMaster", "FunctionPro"],
    },
  ]);

  const [friends, setFriends] = useState<Friend[]>([
    {
      id: "1",
      name: "MathPro2024",
      email: "mathpro@novlearn.fr",
      memberSince: "Août 2024",
      exercisesCompleted: 58,
      level: "Terminale",
    },
    {
      id: "2",
      name: "Einstein42",
      email: "einstein42@novlearn.fr",
      memberSince: "Septembre 2024",
      exercisesCompleted: 35,
      level: "Terminale",
    },
  ]);

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([
    {
      id: "1",
      from: "CalculGenius",
      fromId: "3",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"main" | "friends">("main");

  // Filtrer les classes par nom
  const filteredClasses = allClasses.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Rechercher une classe par code
  const searchByCode = () => {
    const foundClass = allClasses.find((cls) => cls.code === "#" + codeInput);
    if (foundClass) {
      setSelectedClass(foundClass);
      setShowCodeInput(false);
      setCodeInput("");
    }
  };

  // Rejoindre une classe
  const handleJoinClass = (classData: ClassData) => {
    if (!joinedClasses.find((c) => c.id === classData.id)) {
      const updatedClass = {
        ...classData,
        members: [...classData.members, "GOTAGA"],
      };
      setJoinedClasses([...joinedClasses, updatedClass]);
      setSelectedClass(updatedClass);
    }
  };

  // Envoyer une demande d'ami
  const handleSendFriendRequest = (memberName: string) => {
    alert(`Demande d'ami envoyée à ${memberName}`);
  };

  // Accepter une demande d'ami
  const handleAcceptFriendRequest = (request: FriendRequest) => {
    const newFriend: Friend = {
      id: request.fromId,
      name: request.from,
      email: `${request.from.toLowerCase()}@novlearn.fr`,
      memberSince: "Novembre 2024",
      exercisesCompleted: 0,
      level: "Terminale",
    };
    setFriends([...friends, newFriend]);
    setFriendRequests(friendRequests.filter((r) => r.id !== request.id));
  };

  // Refuser une demande d'ami
  const handleDeclineFriendRequest = (requestId: string) => {
    setFriendRequests(friendRequests.filter((r) => r.id !== requestId));
  };

  // Vue du profil d'un ami
  if (selectedFriend) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
        <div className="max-w-4xl w-full space-y-6">
          <button
            onClick={() => setSelectedFriend(null)}
            className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-600/60 rounded-xl px-4 py-3 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
            <span
              className="text-white"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              Retour
            </span>
          </button>

          <div className="text-center">
            <h2
              className="text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
            >
              Profil de {selectedFriend.name}
            </h2>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <div className="flex flex-col items-center mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl flex items-center justify-center mb-4 shadow-lg">
                <Users className="w-16 h-16 text-white" />
              </div>
              <h3
                className="text-white text-3xl"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
              >
                {selectedFriend.name}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="text-blue-200"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                  >
                    Membre depuis
                  </span>
                </div>
                <p
                  className="text-white"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
                >
                  {selectedFriend.memberSince}
                </p>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="text-blue-200"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                  >
                    Exercices réalisés
                  </span>
                </div>
                <p
                  className="text-white"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500, fontSize: "1.5rem" }}
                >
                  {selectedFriend.exercisesCompleted}
                </p>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="text-blue-200"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                  >
                    Niveau
                  </span>
                </div>
                <p
                  className="text-white"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500, fontSize: "1.5rem" }}
                >
                  {selectedFriend.level}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vue d'une classe sélectionnée
  if (selectedClass) {
    const isJoined = joinedClasses.find((c) => c.id === selectedClass.id);

    return (
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
        <div className="max-w-6xl w-full space-y-6">
          <button
            onClick={() => setSelectedClass(null)}
            className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-600/60 rounded-xl px-4 py-3 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
            <span
              className="text-white"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              Retour
            </span>
          </button>

          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg text-4xl">
                  {selectedClass.emblem}
                </div>
                <h2
                  className="text-white text-3xl"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
                >
                  {selectedClass.name}
                </h2>
              </div>
              <div className="text-right">
                <p
                  className="text-blue-200 mb-1"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
                >
                  Code de classe:
                </p>
                <p
                  className="text-white text-2xl"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
                >
                  {selectedClass.code}
                </p>
              </div>
            </div>

            <p
              className="text-blue-100 mb-6"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500, fontSize: "1.125rem" }}
            >
              {selectedClass.description}
            </p>

            {!isJoined && (
              <button
                onClick={() => handleJoinClass(selectedClass)}
                className="mb-6 px-8 py-4 rounded-3xl bg-gradient-to-b from-green-500 to-green-700 text-white shadow-[0_8px_0_0_rgb(21,128,61),0_13px_20px_rgba(34,197,94,0.3)] transform transition-all duration-200 hover:scale-105 active:scale-95 active:shadow-[0_4px_0_0_rgb(21,128,61),0_6px_15px_rgba(34,197,94,0.3)] active:translate-y-1"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "1.125rem" }}
              >
                Rejoindre la classe
              </button>
            )}

            <div>
              <h3
                className="text-white text-xl mb-4"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
              >
                Membres ({selectedClass.members.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedClass.members.map((member, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      if (member !== "GOTAGA") {
                        handleSendFriendRequest(member);
                      }
                    }}
                    className={`bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between ${
                      member !== "GOTAGA" ? "cursor-pointer hover:bg-slate-800/60" : ""
                    } transition-all`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <span
                        className="text-white"
                        style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                      >
                        {member} {member === "GOTAGA" && "(Vous)"}
                      </span>
                    </div>
                    {member !== "GOTAGA" && (
                      <UserPlus className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vue "Mes amis"
  if (viewMode === "friends") {
    return (
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
        <div className="max-w-6xl w-full space-y-6">
          <button
            onClick={() => setViewMode("main")}
            className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-600/60 rounded-xl px-4 py-3 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
            <span
              className="text-white"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              Retour
            </span>
          </button>

          <div className="text-center">
            <h2
              className="text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
            >
              Mes amis
            </h2>
          </div>

          {/* Demandes d'amis en attente */}
          {friendRequests.length > 0 && (
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
              <h3
                className="text-white text-xl mb-4"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
              >
                Demandes d'amis ({friendRequests.length})
              </h3>
              <div className="space-y-3">
                {friendRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <span
                        className="text-white"
                        style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                      >
                        {request.from}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptFriendRequest(request)}
                        className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all"
                        style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                      >
                        Accepter
                      </button>
                      <button
                        onClick={() => handleDeclineFriendRequest(request.id)}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all"
                        style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                      >
                        Refuser
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Liste des amis */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <h3
              className="text-white text-xl mb-4"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
            >
              Amis ({friends.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  onClick={() => setSelectedFriend(friend)}
                  className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-800/60 transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p
                      className="text-white"
                      style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                    >
                      {friend.name}
                    </p>
                    <p
                      className="text-blue-200 text-sm"
                      style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 400 }}
                    >
                      {friend.exercisesCompleted} exercices
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vue principale : Mes classes + Rechercher une classe
  return (
    <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
      <div className="max-w-6xl w-full space-y-6">
        <div className="text-center">
          <h2
            className="text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Ma classe
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bloc "Ma classe" ou "Mes classes" */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <h3
              className="text-white text-2xl mb-6"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
            >
              {joinedClasses.length === 0 && "Ma classe"}
              {joinedClasses.length === 1 && "Ma classe"}
              {joinedClasses.length > 1 && "Mes classes"}
            </h3>

            {joinedClasses.length === 0 && (
              <div className="bg-slate-700/50 rounded-2xl p-8 text-center">
                <p
                  className="text-gray-400 text-xl"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                >
                  Aucune classe rejointe 😵‍💫
                </p>
              </div>
            )}

            {joinedClasses.length === 1 && (
              <div
                onClick={() => setSelectedClass(joinedClasses[0])}
                className="cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 flex flex-col items-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg text-6xl mb-4">
                    {joinedClasses[0].emblem}
                  </div>
                  <h4
                    className="text-white text-2xl"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
                  >
                    {joinedClasses[0].name}
                  </h4>
                  <p
                    className="text-blue-200 mt-2"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
                  >
                    {joinedClasses[0].members.length} membres
                  </p>
                </div>
              </div>
            )}

            {joinedClasses.length > 1 && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {joinedClasses.map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-800/60 transition-all"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl">
                      {cls.emblem}
                    </div>
                    <div className="flex-1">
                      <p
                        className="text-white"
                        style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
                      >
                        {cls.name}
                      </p>
                      <p
                        className="text-blue-200 text-sm"
                        style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 400 }}
                      >
                        {cls.members.length} membres
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bloc "Rechercher une classe" */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <h3
              className="text-white text-2xl mb-6"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
            >
              Rechercher une classe
            </h3>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
              <input
                type="text"
                placeholder="Nom de la classe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/60 text-white rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
              />
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {filteredClasses.map((cls) => (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-800/60 transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
                    {cls.emblem}
                  </div>
                  <div className="flex-1">
                    <p
                      className="text-white"
                      style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                    >
                      {cls.name}
                    </p>
                    <p
                      className="text-blue-200 text-sm"
                      style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 400 }}
                    >
                      {cls.members.length} membres
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {!showCodeInput && (
              <button
                onClick={() => setShowCodeInput(true)}
                className="w-full px-6 py-3 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 text-white shadow-lg hover:scale-105 transition-all"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
              >
                <Hash className="inline-block w-5 h-5 mr-2" />
                Utiliser un code
              </button>
            )}

            {showCodeInput && (
              <div className="space-y-2">
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
                  <input
                    type="text"
                    placeholder="AB12CD34"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    maxLength={8}
                    className="w-full bg-slate-900/60 text-white rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={searchByCode}
                    className="flex-1 px-6 py-3 rounded-2xl bg-gradient-to-b from-green-500 to-green-700 text-white shadow-lg hover:scale-105 transition-all"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
                  >
                    Rechercher
                  </button>
                  <button
                    onClick={() => {
                      setShowCodeInput(false);
                      setCodeInput("");
                    }}
                    className="px-6 py-3 rounded-2xl bg-slate-700/50 hover:bg-slate-600/60 text-white transition-all"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}