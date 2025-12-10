import { User, Mail, Calendar, Award, Users } from "lucide-react";
import { useState } from "react";

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

export function AccountPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "friends">("profile");
  
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

  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

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
            className="bg-slate-700/50 hover:bg-slate-600/60 rounded-xl px-4 py-3 transition-all"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
          >
            <span className="text-white">← Retour</span>
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
                <User className="w-16 h-16 text-white" />
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
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <span
                    className="text-blue-200"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                  >
                    Membre depuis
                  </span>
                </div>
                <p
                  className="text-white ml-8"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
                >
                  {selectedFriend.memberSince}
                </p>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-5 h-5 text-blue-400" />
                  <span
                    className="text-blue-200"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                  >
                    Exercices réalisés
                  </span>
                </div>
                <p
                  className="text-white ml-8"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500, fontSize: "1.5rem" }}
                >
                  {selectedFriend.exercisesCompleted}
                </p>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <span
                    className="text-blue-200"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                  >
                    Niveau
                  </span>
                </div>
                <p
                  className="text-white ml-8"
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

  return (
    <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
      <div className="max-w-4xl w-full space-y-6">
        {/* Titre */}
        <div className="text-center">
          <h2
            className="text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Mon compte
          </h2>
        </div>

        {/* Onglets */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-3 rounded-2xl transition-all ${
              activeTab === "profile"
                ? "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-lg"
                : "bg-slate-700/50 hover:bg-slate-600/60 text-blue-200"
            }`}
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Mon profil
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`px-6 py-3 rounded-2xl transition-all relative ${
              activeTab === "friends"
                ? "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-lg"
                : "bg-slate-700/50 hover:bg-slate-600/60 text-blue-200"
            }`}
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Mes amis
            {friendRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                {friendRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Contenu de l'onglet Profil */}
        {activeTab === "profile" && (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
            {/* Avatar et nom */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-gray-500 to-gray-700 rounded-3xl flex items-center justify-center mb-4 shadow-lg">
                <User className="w-16 h-16 text-white" />
              </div>
              <h3
                className="text-white text-3xl"
                style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
              >
                GOTAGA
              </h3>
            </div>

            {/* Informations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <span
                    className="text-blue-200"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                  >
                    Email
                  </span>
                </div>
                <p
                  className="text-white ml-8"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
                >
                  gotaga@novlearn.fr
                </p>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <span
                    className="text-blue-200"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                  >
                    Membre depuis
                  </span>
                </div>
                <p
                  className="text-white ml-8"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
                >
                  Septembre 2024
                </p>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-5 h-5 text-blue-400" />
                  <span
                    className="text-blue-200"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                  >
                    Exercices réalisés
                  </span>
                </div>
                <p
                  className="text-white ml-8"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500, fontSize: "1.5rem" }}
                >
                  42
                </p>
              </div>

              <div className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <span
                    className="text-blue-200"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
                  >
                    Niveau
                  </span>
                </div>
                <p
                  className="text-white ml-8"
                  style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500, fontSize: "1.5rem" }}
                >
                  Terminale
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contenu de l'onglet Mes amis */}
        {activeTab === "friends" && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}